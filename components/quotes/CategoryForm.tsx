// web\components\quotes\CategoryForm.tsx
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Trash, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { QuotationCategory, QuotationItem } from "@/services/quotations";
import { Product, createProduct } from "@/services/products";
import { formatCurrency, roundUp } from "@/utils/number-format";
import ProductForm from "@/components/products/ProductForm";
import { useNotification } from "@/contexts/NotificationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFormProps {
  category: QuotationCategory;
  categoryIndex: number;
  products: Product[];
  onUpdateCategoryName: (index: number, name: string) => void;
  onRemoveCategory: (index: number) => void;
  onAddItem: (categoryIndex: number) => void;
  onRemoveItem: (categoryIndex: number, itemIndex: number) => void;
  onUpdateItem: (
    categoryIndex: number,
    itemIndex: number,
    field: keyof QuotationItem,
    value: any
  ) => void;
  onAddNewProduct: (product: Product) => void;
  disabled?: boolean;
}

export default function CategoryForm({
  category,
  categoryIndex,
  products,
  onUpdateCategoryName,
  onRemoveCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onAddNewProduct,
  disabled = false,
}: CategoryFormProps) {
  // Estado para controlar la expansión/colapso de la categoría en móvil
  const [isExpanded, setIsExpanded] = useState(true);
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el formulario de crear producto
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [itemIndexForNewProduct, setItemIndexForNewProduct] = useState<
    number | null
  >(null);

  // Estado local para seguimiento de productos
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);

  // Formulario de producto
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    markup: "35",
    imageUrl: "",
  });

  // Actualizamos los productos locales cuando cambia la prop products
  useEffect(() => {
    setLocalProducts([...products]);
  }, [products]);

  // Calcular el total de la categoría
  const calculateCategoryTotal = (): number => {
    return roundUp(
      category.items.reduce((total, item) => {
        // Verificar si el producto existe
        if (!item.product) return total;

        const unitPrice = item.product.unitPrice || 0;
        const markup = item.product.markup || 35;

        // Calcular el precio final correctamente
        const markupAmount = Math.ceil((unitPrice * markup) / 100);
        const finalPrice = unitPrice + markupAmount;

        return total + finalPrice * (item.quantity || 1);
      }, 0)
    );
  };
  // Verificar si hay elementos en la categoría
  const hasItems = category.items.length > 0;

  // Función para manejar la creación de un nuevo producto
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    try {
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
    } catch (error) {
      console.error("Error al previsualizar la imagen:", error);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.unitPrice) {
      setProductFormError("Nombre y precio son obligatorios");
      return false;
    }

    if (itemIndexForNewProduct === null) {
      setProductFormError("Error interno: No se ha especificado un ítem");
      return false;
    }

    try {
      setIsCreatingProduct(true);

      // Asegurarse de que el precio sea un número entero
      const unitPrice = Math.floor(parseFloat(formData.unitPrice));
      const markup = parseFloat(formData.markup);

      // Calcular el precio final con el markup
      const markupAmount = Math.ceil((unitPrice * markup) / 100);
      const finalPrice = unitPrice + markupAmount;

      // Crear un FormData para poder enviar la imagen como archivo
      const productFormData = new FormData();
      productFormData.append("name", formData.name);
      productFormData.append("description", formData.description || "");
      productFormData.append("unitPrice", unitPrice.toString());
      productFormData.append("markup", markup.toString());
      productFormData.append("price", finalPrice.toString());

      // Si hay una imagen en formato base64, convertirla a blob y adjuntarla
      if (formData.imageUrl && formData.imageUrl.startsWith("data:image")) {
        // Convertir base64 a Blob
        const blob = await fetch(formData.imageUrl).then((r) => r.blob());

        // Crear un archivo a partir del blob
        const imageFile = new File([blob], "product-image.png", {
          type: "image/png",
        });

        // Añadir el archivo al FormData
        productFormData.append("image", imageFile);
      }

      // Usar el servicio createProduct con FormData
      const result = await createProduct(productFormData);

      // Agregar el nuevo producto a la lista global de productos
      const newProduct = result.product;

      // Primero actualizamos nuestra lista local de productos para la UI inmediata
      const updatedProducts = [...localProducts, newProduct];
      setLocalProducts(updatedProducts);

      // Muy importante: Llamar a onAddNewProduct para actualizar el estado del padre
      onAddNewProduct(newProduct);

      // Actualizar el ítem seleccionado con el nuevo producto
      onUpdateItem(
        categoryIndex,
        itemIndexForNewProduct,
        "productId",
        newProduct.id
      );
      onUpdateItem(
        categoryIndex,
        itemIndexForNewProduct,
        "price",
        newProduct.price
      );
      onUpdateItem(
        categoryIndex,
        itemIndexForNewProduct,
        "product",
        newProduct
      );

      // Mostrar notificación de éxito
      addNotification("success", "Producto creado correctamente");

      // Cerrar el diálogo y resetear el formulario
      setIsNewProductDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        unitPrice: "",
        markup: "35",
        imageUrl: "",
      });
      setProductFormError(null);
      setItemIndexForNewProduct(null);

      return true;
    } catch (err) {
      console.error("Error al crear producto:", err);
      setProductFormError("Error al crear el producto");
      addNotification("error", "Error al crear el producto");
      return false;
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Método para cerrar el diálogo de producto
  const handleCloseProductDialog = () => {
    setIsNewProductDialogOpen(false);
    setItemIndexForNewProduct(null);
    setProductFormError(null);
  };

  return (
    <Card className="p-3">
      {/* Cabecera de la categoría con nombre y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center flex-1">
          {/* Botón para expandir/colapsar en móvil */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 mr-2 sm:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>

          <FormField className="flex-grow">
            <FormLabel className="hidden sm:block">
              Nombre de Categoría
            </FormLabel>
            <Input
              value={category.name}
              onChange={(e) =>
                onUpdateCategoryName(categoryIndex, e.target.value)
              }
              placeholder="Ej: Servicios, Productos, etc."
              className="text-sm"
              required
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Total de la categoría siempre visible */}
          {/* <div className="bg-primary/10 px-3 py-1 rounded text-sm">
            <span className="hidden sm:inline">Total de la categoría: </span>
            <span className="font-medium">
              {formatCurrency(calculateCategoryTotal())}
            </span>
          </div> */}

          {/* Botón para eliminar categoría */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-0 sm:mt-6"
            onClick={() => onRemoveCategory(categoryIndex)}
            disabled={disabled}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido de la categoría (productos) - colapsable en móvil */}
      <div className={`space-y-3 ${isExpanded ? "block" : "hidden sm:block"}`}>
        {/* Lista de productos */}
        {category.items.map((item, itemIndex) => {
          console.log("item", item);
          return (
            <div
              key={`item-${categoryIndex}-${itemIndex}`}
              className={
                !item.productId || item.productId === 0
                  ? "border border-red-300 rounded-md p-2 bg-red-50"
                  : ""
              }
            >
              {(!item.productId || item.productId === 0) && (
                <p className="text-red-500 text-xs mb-2">
                  ⚠️ Seleccione un producto o elimine esta fila
                </p>
              )}
              <div className="border rounded-md p-3 mb-3 bg-white shadow-sm">
                {/* Cabecera de la fila del producto con botón de eliminar */}
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">
                    Producto {itemIndex + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onRemoveItem(categoryIndex, itemIndex)}
                    disabled={disabled}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selector de producto */}
                <div className="mb-3">
                  <FormLabel className="text-xs">
                    Producto{" "}
                    {(!item.productId || item.productId === 0) && (
                      <span className="text-red-500 text-xs ml-1">
                        *Requerido
                      </span>
                    )}
                  </FormLabel>
                  <Select
                    value={item.productId ? item.productId.toString() : "0"}
                    onValueChange={(value) => {
                      if (value === "new") {
                        // Abrir diálogo para crear producto
                        setItemIndexForNewProduct(itemIndex);
                        setIsNewProductDialogOpen(true);
                      } else {
                        const productId = parseInt(value);
                        // Importante: Usar localProducts para buscar el producto
                        const selectedProduct = localProducts.find(
                          (p) => p.id === productId
                        );
                        onUpdateItem(
                          categoryIndex,
                          itemIndex,
                          "productId",
                          productId
                        );

                        if (selectedProduct) {
                          // Asegurar que el precio no tenga decimales
                          const priceWithoutDecimals = Math.floor(
                            selectedProduct.price || 0
                          );
                          onUpdateItem(
                            categoryIndex,
                            itemIndex,
                            "price",
                            priceWithoutDecimals
                          );
                          onUpdateItem(
                            categoryIndex,
                            itemIndex,
                            "product",
                            selectedProduct
                          );
                        }
                      }
                    }}
                    className={
                      !item.productId || item.productId === 0
                        ? "border-red-300"
                        : ""
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear nuevo producto
                        </div>
                      </SelectItem>
                      {/* Usamos la lista local para que se actualice inmediatamente */}
                      {localProducts.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id?.toString() || ""}
                        >
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!item.productId || item.productId === 0) && (
                    <p className="text-red-500 text-xs mt-1">
                      Por favor, seleccione un producto
                    </p>
                  )}
                </div>

                {/* Campos para cantidad y precio */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
                  {/* Cantidad */}
                  <div>
                    <FormLabel className="text-xs">Cantidad</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        onUpdateItem(
                          categoryIndex,
                          itemIndex,
                          "quantity",
                          value
                        );
                      }}
                      className="h-9"
                      required
                      disabled={disabled}
                    />
                  </div>

                  {/* Precio proveedor */}
                  <div>
                    <FormLabel className="text-xs">Proveedor</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      value={item.product ? item.product.unitPrice || 0 : 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        onUpdateItem(categoryIndex, itemIndex, "price", value);
                      }}
                      className="h-9"
                      placeholder="Solo números enteros"
                      required
                      disabled={disabled}
                    />
                  </div>

                  {/* % Ganancia */}
                  <div className="col-span-1 md:col-span-1">
                    <FormLabel className="text-xs">% Ganancia</FormLabel>
                    <Input
                      value={`${
                        item.product ? item.product.markup || 35 : 35
                      }%`}
                      className="h-9 bg-gray-50"
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Ganancia */}
                  <div className="col-span-1 md:col-span-1">
                    <FormLabel className="text-xs">Ganancia</FormLabel>
                    <Input
                      value={formatCurrency(
                        Math.ceil(
                          ((item.product ? item.product.unitPrice || 0 : 0) *
                            (item.product ? item.product.markup || 35 : 35)) /
                            100
                        )
                      )}
                      className="h-9 bg-gray-50"
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Precio */}
                  <div className="col-span-1 md:col-span-1">
                    <FormLabel className="text-xs">Precio</FormLabel>
                    <Input
                      value={formatCurrency(
                        (item.product ? item.product.unitPrice || 0 : 0) +
                          Math.ceil(
                            ((item.product ? item.product.unitPrice || 0 : 0) *
                              (item.product ? item.product.markup || 35 : 35)) /
                              100
                          )
                      )}
                      className="h-9 bg-gray-50"
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-1 md:col-span-1">
                    <FormLabel className="text-xs">Total</FormLabel>
                    <Input
                      value={formatCurrency(
                        ((item.product ? item.product.unitPrice || 0 : 0) +
                          Math.ceil(
                            ((item.product ? item.product.unitPrice || 0 : 0) *
                              (item.product ? item.product.markup || 35 : 35)) /
                              100
                          )) *
                          (item.quantity || 1)
                      )}
                      className="h-9 bg-gray-50 font-medium"
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mensaje cuando no hay productos */}
        {!hasItems && (
          <div className="text-sm text-muted-foreground text-center py-3">
            No hay productos en esta categoría
          </div>
        )}

        {/* Botón para agregar productos */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddItem(categoryIndex);
          }}
          className="w-full sm:w-auto mt-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Modal para crear nuevo producto utilizando ProductForm */}
      {isNewProductDialogOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <ProductForm
            currentProduct={null}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveProduct}
            onCancel={handleCloseProductDialog}
            onUploadImage={handleImageUpload}
            fileInputRef={fileInputRef}
            isUploading={false}
            isSubmitting={isCreatingProduct}
            error={productFormError}
          />
        </div>
      )}

      {/* Input oculto para subir archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </Card>
  );
}
