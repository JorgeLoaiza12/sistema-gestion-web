"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash, Package, DollarSign, Tag } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "@/services/products";
import { useNotification } from "@/contexts/NotificationContext";
import { formatCurrency, roundUp } from "@/utils/number-format";
import ProductForm from "@/components/products/ProductForm";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  // Estado para guardar el archivo de imagen
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    markup: "35",
    imageUrl: "",
  });

  const sortOptions = [
    { value: "newest", label: "Más recientes" },
    { value: "oldest", label: "Más antiguos" },
    { value: "name_asc", label: "Nombre A-Z" },
    { value: "name_desc", label: "Nombre Z-A" },
    { value: "price_asc", label: "Precio menor a mayor" },
    { value: "price_desc", label: "Precio mayor a menor" },
  ];

  // Obtener productos del backend al montar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError("Error al cargar los productos");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtrar productos y ordenarlos según el valor de sortBy
  const filteredProducts = products
    .filter((product) =>
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt || "").getTime() -
            new Date(b.createdAt || "").getTime()
          );
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleAddProduct = () => {
    setIsEditing(true);
    setCurrentProduct(null);
    setFormData({
      name: "",
      description: "",
      unitPrice: "",
      markup: "35",
      imageUrl: "",
    });
    setSelectedImageFile(null);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      unitPrice: roundUp(product.unitPrice).toString(),
      markup: product.markup.toString(),
      imageUrl: product.imageUrl || "",
    });
    setSelectedImageFile(null);
  };

  const openDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsDeletingProduct(true);
      await deleteProduct(productToDelete.id?.toString() || "");
      setProducts(
        products.filter((product) => product.id !== productToDelete.id)
      );
      setError(null);
      addNotification("success", "Producto eliminado correctamente");
    } catch (err) {
      setError("Error al eliminar el producto");
      addNotification("error", "Error al eliminar el producto");
      console.error(err);
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSaveProduct = async () => {
    // Validación básica
    if (!formData.name || !formData.unitPrice) {
      setError("El nombre y precio unitario son obligatorios");
      return;
    }

    try {
      // Convertir y validar valores numéricos
      const unitPrice = roundUp(parseFloat(formData.unitPrice));
      const markup = parseFloat(formData.markup);

      if (isNaN(unitPrice) || unitPrice <= 0) {
        setError("El precio unitario debe ser un número mayor que cero");
        return;
      }

      if (isNaN(markup) || markup < 0) {
        setError("El porcentaje de ganancia debe ser un número no negativo");
        return;
      }

      // Calcular el precio final con el markup
      const markupAmount = Math.ceil((unitPrice * markup) / 100);
      const finalPrice = unitPrice + markupAmount;

      // Crear un FormData para enviar los datos y la imagen
      const productFormData = new FormData();
      productFormData.append("name", formData.name);
      productFormData.append("description", formData.description || "");
      productFormData.append("unitPrice", unitPrice.toString());
      productFormData.append("markup", markup.toString());
      productFormData.append("price", finalPrice.toString());

      // Manejar la imagen
      if (selectedImageFile) {
        // Si hay un archivo seleccionado, añadirlo directamente
        productFormData.append("image", selectedImageFile);
      } else if (
        formData.imageUrl &&
        formData.imageUrl.startsWith("data:image")
      ) {
        // Si hay una imagen en formato Base64, convertirla a Blob y File
        const blob = await fetch(formData.imageUrl).then((r) => r.blob());
        const imageFile = new File([blob], "product-image.png", {
          type: "image/png",
        });
        productFormData.append("image", imageFile);
      } else if (formData.imageUrl && currentProduct) {
        // Si hay una URL de imagen existente y estamos editando, mantenerla
        productFormData.append("imageUrl", formData.imageUrl);
      }

      if (currentProduct) {
        // Actualizar producto existente
        const response = await updateProduct(
          currentProduct.id?.toString() || "",
          productFormData,
          undefined // Ya no pasamos el archivo por separado
        );

        const updatedProduct = response.product;
        setProducts(
          products.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
        addNotification("success", "Producto actualizado correctamente");
      } else {
        // Crear nuevo producto usando FormData
        const response = await createProduct(productFormData);
        const newProduct = response.product;
        setProducts([...products, newProduct]);
        addNotification("success", "Producto creado correctamente");
      }

      // Limpiar estados y cerrar el formulario
      setIsEditing(false);
      setCurrentProduct(null);
      setSelectedImageFile(null);
      setError(null);
    } catch (err) {
      setError("Error al guardar el producto");
      addNotification("error", "Error al guardar el producto");
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedImageFile(file);

    try {
      setIsUploading(true);

      // Mostrar vista previa de la imagen inmediatamente
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFormData({
            ...formData,
            imageUrl: event.target.result.toString(),
          });
        }
      };
      reader.readAsDataURL(file);

      addNotification("success", "Imagen seleccionada correctamente");
    } catch (error) {
      console.error("Error al previsualizar la imagen:", error);
      addNotification("error", "Error al previsualizar la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  // Columnas para el DataTable
  const columns: ColumnDef<Product>[] = [
    {
      id: "product",
      header: "Producto",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={row.original.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-sm text-content-subtle">
                {row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "unitPrice",
      header: "Precio Unitario",
      cell: ({ row }) => {
        const unitPrice = roundUp(row.original.unitPrice || 0);
        return (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-content-subtle" />
            <span className="font-medium">{formatCurrency(unitPrice)}</span>
          </div>
        );
      },
    },
    {
      id: "markup",
      header: "Ganancia",
      cell: ({ row }) => {
        const unitPrice = roundUp(row.original.unitPrice || 0);
        const markup = row.original.markup || 0;
        // Calcular el monto exacto de ganancia
        const markupAmount = Math.ceil((unitPrice * markup) / 100);

        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-content-subtle" />
            <span className="font-medium">{formatCurrency(markupAmount)}</span>
            <span className="text-xs text-content-subtle">({markup}%)</span>
          </div>
        );
      },
    },
    {
      id: "price",
      header: "Precio Final",
      cell: ({ row }) => {
        const price = roundUp(row.original.price || 0);
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-content-subtle" />
            <span className="font-medium">{formatCurrency(price)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteConfirm(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Productos</h1>
        <p className="text-content-subtle mt-2">
          Gestiona tu catálogo de productos
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Lista de Productos</h2>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-auto md:max-w-xs"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddProduct} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center h-96 flex items-center justify-center">
            <p>Cargando productos...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredProducts} />
        )}
      </Card>

      {error && <div className="text-center text-red-500">{error}</div>}

      {isEditing && (
        <ProductForm
          currentProduct={currentProduct}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsEditing(false);
            setSelectedImageFile(null);
          }}
          onUploadImage={handleImageUpload}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
        />
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Eliminar Producto"
        description={`¿Estás seguro que deseas eliminar el producto "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteProduct}
        confirmLabel="Eliminar"
        isLoading={isDeletingProduct}
      />

      {/* Input oculto para subir archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
}
