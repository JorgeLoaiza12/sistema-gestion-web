import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus } from "lucide-react";
import { createProduct, type Product } from "@/services/products";
import { QuotationItem } from "@/services/quotations";
import { formatCurrency, roundUp } from "@/utils/number-format";
import ProductForm from "@/components/products/ProductForm";

interface ProductItemFormProps {
  categoryIndex: number;
  itemIndex: number;
  item: QuotationItem;
  products: Product[];
  onUpdate: (
    categoryIndex: number,
    itemIndex: number,
    field: keyof QuotationItem,
    value: any
  ) => void;
  onRemove: (categoryIndex: number, itemIndex: number) => void;
  onAddNewProduct: (product: Product) => void;
}

export default function ProductItemForm({
  categoryIndex,
  itemIndex,
  item,
  products,
  onUpdate,
  onRemove,
  onAddNewProduct,
}: ProductItemFormProps) {
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locales para manejar los inputs
  const [quantityInput, setQuantityInput] = useState<string>(
    item.quantity ? item.quantity.toString() : "1"
  );
  const [priceInput, setPriceInput] = useState<string>(
    (item.price || (item.product ? item.product.price : 0))
      .toString()
      .split(".")[0] 
  );

  // Asegurarse de que tengamos acceso a los datos del producto
  const selectedProduct =
    item.product ||
    (item.productId ? products.find((p) => p.id === item.productId) : null);

  // Calcular el precio de proveedor y ganancia (sin decimales)
  const providerPrice = parseInt(priceInput) || 0;

  // Obtener el markup del producto seleccionado o usar 35% por defecto
  const markupPercentage = selectedProduct?.markup || 35;

  // Calcular la ganancia basada en el precio del proveedor y el markup
  const profit = Math.ceil((providerPrice * markupPercentage) / 100);

  // Calcular el precio final y el total
  const finalPrice = providerPrice + profit;
  const quantity = parseInt(quantityInput) || 1;
  const lineTotal = Math.ceil(finalPrice * quantity);

  // Actualizar los estados locales cuando cambian las props
  useEffect(() => {
    setQuantityInput(item.quantity ? item.quantity.toString() : "1");
  }, [item.quantity]);

  useEffect(() => {
    // Solo actualizamos el precio de entrada si no ha sido modificado manualmente
    // o si ha cambiado el producto seleccionado
    if (selectedProduct) {
      const price = item.price || selectedProduct.price || 0;
      // Asegurar que no haya decimales
      setPriceInput(Math.floor(price).toString());
    }
  }, [item.productId, selectedProduct]);

  // Estado para el formulario de producto
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    markup: "35",
    imageUrl: "",
  });

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
      setError("Nombre y precio son obligatorios");
      return;
    }

    try {
      setIsCreatingProduct(true);

      // Asegurarse de que el precio sea un número entero
      const unitPrice = Math.floor(parseFloat(formData.unitPrice));
      const markup = parseFloat(formData.markup);

      // Calcular el precio final con el markup
      const markupAmount = Math.ceil((unitPrice * markup) / 100);
      const finalPrice = unitPrice + markupAmount;

      const result = await createProduct({
        name: formData.name,
        description: formData.description,
        unitPrice: unitPrice,
        markup: markup,
        price: finalPrice,
        imageUrl: formData.imageUrl,
      } as Product);

      // Agregar el nuevo producto a la lista global de productos
      const newProduct = result.product;
      onAddNewProduct(newProduct);

      // Importante: Se debe actualizar primero el productId antes de actualizar price o product
      // para evitar que los componentes se vuelvan a renderizar de forma incorrecta

      // Actualizar el producto en el ítem actual
      onUpdate(categoryIndex, itemIndex, "productId", newProduct.id);
      onUpdate(categoryIndex, itemIndex, "price", newProduct.price);
      onUpdate(categoryIndex, itemIndex, "product", newProduct);

      // Cerrar el diálogo y resetear el formulario
      setIsNewProductDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        unitPrice: "",
        markup: "35",
        imageUrl: "",
      });
      setError(null);
    } catch (err) {
      console.error("Error al crear producto:", err);
      setError("Error al crear el producto");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Manejadores para inputs con blurring para actualizar solo cuando se pierde el foco
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantityInput(e.target.value);
  };

  const handleQuantityBlur = () => {
    // Si está vacío, establecer un valor predeterminado de 1
    const newValue = quantityInput === "" ? 1 : parseInt(quantityInput);
    // Asegurarse de que sea un número válido
    const validValue = isNaN(newValue) || newValue < 1 ? 1 : newValue;
    onUpdate(categoryIndex, itemIndex, "quantity", validValue);
    setQuantityInput(validValue.toString());
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números enteros (sin decimales)
    const value = e.target.value.replace(/\D/g, "");
    setPriceInput(value);
  };

  const handlePriceBlur = () => {
    // Si está vacío, establecer un valor predeterminado de 0
    const newValue = priceInput === "" ? 0 : parseInt(priceInput);
    // Asegurarse de que sea un número válido entero
    const validValue = isNaN(newValue) || newValue < 0 ? 0 : newValue;

    // Actualizar el precio en el estado global
    onUpdate(categoryIndex, itemIndex, "price", validValue);
    setPriceInput(validValue.toString());
  };

  // Diseño mejorado para dispositivos móviles y escritorio
  return (
    <div className="border rounded-md p-3 mb-3 bg-white shadow-sm">
      {/* Cabecera de la fila del producto con botón de eliminar */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Producto {itemIndex + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onRemove(categoryIndex, itemIndex)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      {/* Selector de producto - ocupa ancho completo en móvil */}
      <div className="mb-3">
        <FormLabel className="text-xs">
          Producto{" "}
          {(!item.productId || item.productId === 0) && (
            <span className="text-red-500 text-xs ml-1">*Requerido</span>
          )}
        </FormLabel>
        <Select
          value={item.productId ? item.productId.toString() : "0"}
          onValueChange={(value) => {
            if (value === "new") {
              setIsNewProductDialogOpen(true);
            } else {
              const productId = parseInt(value);
              const selectedProduct = products.find((p) => p.id === productId);
              onUpdate(categoryIndex, itemIndex, "productId", productId);

              if (selectedProduct) {
                // Asegurar que el precio no tenga decimales
                const priceWithoutDecimals = Math.floor(
                  selectedProduct.price || 0
                );
                onUpdate(
                  categoryIndex,
                  itemIndex,
                  "price",
                  priceWithoutDecimals
                );
                onUpdate(categoryIndex, itemIndex, "product", selectedProduct);
                setPriceInput(priceWithoutDecimals.toString());
              }
            }
          }}
          className={
            !item.productId || item.productId === 0 ? "border-red-300" : ""
          }
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
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id?.toString() || ""}>
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

      {/* Grid de 2 columnas para móvil y configuraciones más grandes */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
        {/* Cantidad */}
        <div>
          <FormLabel className="text-xs">Cantidad</FormLabel>
          <Input
            type="text"
            value={quantityInput}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            min="1"
            className="h-9"
            required
          />
        </div>

        {/* Precio proveedor */}
        <div>
          <FormLabel className="text-xs">Proveedor</FormLabel>
          <Input
            type="text"
            value={priceInput}
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            min="0"
            className="h-9"
            placeholder="Solo números enteros"
            required
          />
        </div>

        {/* % Ganancia */}
        <div className="col-span-1 md:col-span-1">
          <FormLabel className="text-xs">% Ganancia</FormLabel>
          <Input
            value={`${markupPercentage}%`}
            className="h-9 bg-gray-50"
            readOnly
            disabled
          />
        </div>

        {/* Ganancia */}
        <div className="col-span-1 md:col-span-1">
          <FormLabel className="text-xs">Ganancia</FormLabel>
          <Input
            value={formatCurrency(profit)}
            className="h-9 bg-gray-50"
            readOnly
            disabled
          />
        </div>

        {/* Precio */}
        <div className="col-span-1 md:col-span-1">
          <FormLabel className="text-xs">Precio</FormLabel>
          <Input
            value={formatCurrency(finalPrice)}
            className="h-9 bg-gray-50"
            readOnly
            disabled
          />
        </div>

        {/* Total */}
        <div className="col-span-1 md:col-span-1">
          <FormLabel className="text-xs">Total</FormLabel>
          <Input
            value={formatCurrency(lineTotal)}
            className="h-9 bg-gray-50 font-medium"
            readOnly
            disabled
          />
        </div>
      </div>

      {/* Modal para crear nuevo producto */}
      {isNewProductDialogOpen && (
        <ProductForm
          currentProduct={null}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveProduct}
          onCancel={() => setIsNewProductDialogOpen(false)}
          onUploadImage={handleImageUpload}
          fileInputRef={fileInputRef}
          isUploading={isCreatingProduct}
        />
      )}

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
