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
import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import {
  Plus,
  Edit,
  Trash,
  Package,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Tag,
  Percent,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    // Validar si el precio unitario es un número válido
    if (
      isNaN(parseFloat(formData.unitPrice)) ||
      parseFloat(formData.unitPrice) <= 0
    ) {
      setError("El precio unitario debe ser un número mayor que cero");
      return;
    }

    // Validar si el porcentaje de ganancia es un número válido
    if (isNaN(parseFloat(formData.markup)) || parseFloat(formData.markup) < 0) {
      setError("El porcentaje de ganancia debe ser un número no negativo");
      return;
    }

    const unitPrice = roundUp(parseFloat(formData.unitPrice));
    const markup = parseFloat(formData.markup);

    // Calcular el precio final con el markup
    const markupAmount = Math.ceil((unitPrice * markup) / 100);
    const finalPrice = unitPrice + markupAmount;

    try {
      if (currentProduct) {
        // Actualizar producto existente
        const response = await updateProduct(
          currentProduct.id?.toString() || "",
          {
            ...currentProduct,
            name: formData.name,
            description: formData.description,
            unitPrice: unitPrice,
            markup: markup,
            price: finalPrice,
            imageUrl: formData.imageUrl,
          },
          selectedImageFile || undefined
        );
        const updatedProduct = response.product;
        setProducts(
          products.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
        addNotification("success", "Producto actualizado correctamente");
      } else {
        // Crear nuevo producto
        const response = await createProduct(
          {
            name: formData.name,
            description: formData.description,
            unitPrice: unitPrice,
            markup: markup,
            price: finalPrice,
            imageUrl: formData.imageUrl,
          },
          selectedImageFile || undefined
        );
        const newProduct = response.product;
        setProducts([...products, newProduct]);
        addNotification("success", "Producto creado correctamente");
      }
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
              <SelectContent>
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

interface ProductFormProps {
  currentProduct: Product | null;
  formData: {
    name: string;
    description: string;
    unitPrice: string;
    markup: string;
    imageUrl: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      unitPrice: string;
      markup: string;
      imageUrl: string;
    }>
  >;
  onSave: () => void;
  onCancel: () => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
}

function ProductForm({
  currentProduct,
  formData,
  setFormData,
  onSave,
  onCancel,
  onUploadImage,
  fileInputRef,
  isUploading,
}: ProductFormProps) {
  // Calcular el precio final en tiempo real
  const unitPrice = parseFloat(formData.unitPrice) || 0;
  const markup = parseFloat(formData.markup) || 0;
  const markupAmount = Math.ceil((unitPrice * markup) / 100);
  const finalPrice = unitPrice + markupAmount;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentProduct ? "Editar Producto" : "Agregar Producto"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          <FormField>
            <FormLabel>Nombre</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </FormField>

          <FormField>
            <FormLabel>Descripción</FormLabel>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Precio unitario</FormLabel>
              <Input
                type="number"
                step="1"
                min="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                required
              />
              <FormDescription>Precio base/proveedor</FormDescription>
            </FormField>

            <FormField>
              <FormLabel>Ganancia (%)</FormLabel>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.markup}
                onChange={(e) =>
                  setFormData({ ...formData, markup: e.target.value })
                }
                required
              />
              <FormDescription>
                Porcentaje sobre el precio unitario
              </FormDescription>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Ganancia ($)</FormLabel>
              <Input
                type="text"
                value={formatCurrency(markupAmount)}
                disabled
              />
              <FormDescription>Monto de ganancia</FormDescription>
            </FormField>

            <FormField>
              <FormLabel>Precio final</FormLabel>
              <Input type="text" value={formatCurrency(finalPrice)} disabled />
              <FormDescription>Precio de venta</FormDescription>
            </FormField>
          </div>

          <FormField>
            <FormLabel>Imagen</FormLabel>
            <div className="flex flex-col gap-4">
              {formData.imageUrl && (
                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa del producto"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  "Subiendo..."
                ) : formData.imageUrl ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Cambiar imagen
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir imagen
                  </>
                )}
              </Button>
            </div>
          </FormField>

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
