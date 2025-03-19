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

  // Estado para el formulario de producto
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    markup: "35",
    imageUrl: "",
  });

  // Calcular el precio de proveedor y ganancia
  const providerPrice = roundUp(
    item.price || (item.product ? item.product.price : 0)
  );
  const profit = Math.ceil(providerPrice * 0.35);
  const finalPrice = providerPrice + profit;
  const lineTotal = Math.ceil(finalPrice * item.quantity);

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

      // Asegurarse de que el precio sea un número y redondearlo hacia arriba
      const unitPrice = roundUp(parseFloat(formData.unitPrice));
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

  return (
    <div className="grid grid-cols-12 gap-3 items-end">
      <div className="col-span-5">
        <FormLabel>
          Producto{" "}
          {(!item.productId || item.productId === 0) && (
            <span className="text-red-500 text-xs ml-1">*Requerido</span>
          )}
        </FormLabel>
        <div className="flex space-x-2">
          <Select
            value={item.productId ? item.productId.toString() : "0"}
            onValueChange={(value) => {
              if (value === "new") {
                setIsNewProductDialogOpen(true);
              } else {
                const productId = parseInt(value);

                // Buscar el producto seleccionado
                const selectedProduct = products.find(
                  (p) => p.id === productId
                );

                // Actualizar todos los campos relacionados
                onUpdate(categoryIndex, itemIndex, "productId", productId);

                if (selectedProduct) {
                  onUpdate(
                    categoryIndex,
                    itemIndex,
                    "price",
                    selectedProduct.price
                  );
                  onUpdate(
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
                ? "border-red-300 focus:ring-red-500"
                : ""
            }
          >
            <SelectTrigger>
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
                <SelectItem
                  key={product.id}
                  value={product.id?.toString() || ""}
                >
                  {product.name} - {formatCurrency(product.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(!item.productId || item.productId === 0) && (
          <p className="text-red-500 text-xs mt-1">
            Por favor, seleccione un producto o elimine esta fila
          </p>
        )}
      </div>

      <div className="col-span-1">
        <FormLabel>Cantidad</FormLabel>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            onUpdate(
              categoryIndex,
              itemIndex,
              "quantity",
              parseInt(e.target.value || "1")
            )
          }
          min="1"
          required
        />
      </div>

      <div className="col-span-1">
        <FormLabel>Proveedor</FormLabel>
        <Input
          type="number"
          value={providerPrice}
          onChange={(e) =>
            onUpdate(
              categoryIndex,
              itemIndex,
              "price",
              parseFloat(e.target.value || "0")
            )
          }
          min="0"
          step="1"
          required
        />
      </div>

      <div className="col-span-1">
        <FormLabel>Ganancia</FormLabel>
        <Input value={formatCurrency(profit)} readOnly disabled />
      </div>

      <div className="col-span-1">
        <FormLabel>Precio</FormLabel>
        <Input value={formatCurrency(finalPrice)} readOnly disabled />
      </div>

      <div className="col-span-2">
        <FormLabel>Total</FormLabel>
        <Input value={formatCurrency(lineTotal)} readOnly disabled />
      </div>

      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(categoryIndex, itemIndex)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      {/* Usar el ProductForm reutilizable */}
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
