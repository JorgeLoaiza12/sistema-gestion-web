import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular el precio de proveedor y ganancia
  const providerPrice = roundUp(
    item.price || (item.product ? item.product.price : 0)
  );
  const profit = Math.ceil(providerPrice * 0.35);
  const finalPrice = providerPrice + profit;
  const lineTotal = Math.ceil(finalPrice * item.quantity);

  const handleCreateNewProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      setError("Nombre y precio son obligatorios");
      return;
    }

    try {
      setIsCreatingProduct(true);

      // Asegurarse de que el precio sea un número y redondearlo hacia arriba
      const price = roundUp(newProduct.price);
      const result = await createProduct({
        ...newProduct,
        price: price,
        unitPrice: price,
        markup: 35,
      } as Product);

      // Agregar el nuevo producto a la lista local
      onAddNewProduct(result.product);

      // Seleccionar el nuevo producto en el ítem actual
      onUpdate(categoryIndex, itemIndex, "productId", result.product.id);
      onUpdate(categoryIndex, itemIndex, "price", result.product.price);
      onUpdate(categoryIndex, itemIndex, "product", result.product);

      // Cerrar el diálogo
      setIsNewProductDialogOpen(false);
      setNewProduct({
        name: "",
        description: "",
        price: 0,
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
        <FormLabel>Producto</FormLabel>
        <div className="flex space-x-2">
          <Select
            value={item.productId ? item.productId.toString() : "0"}
            onValueChange={(value) => {
              if (value === "new") {
                setIsNewProductDialogOpen(true);
              } else {
                onUpdate(
                  categoryIndex,
                  itemIndex,
                  "productId",
                  parseInt(value)
                );
              }
            }}
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

      {/* Diálogo para crear nuevo producto */}
      <Dialog
        open={isNewProductDialogOpen}
        onOpenChange={setIsNewProductDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormField>
              <FormLabel>Nombre del Producto</FormLabel>
              <Input
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="Nombre del producto"
                required
              />
            </FormField>

            <FormField>
              <FormLabel>Descripción (opcional)</FormLabel>
              <Input
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Descripción del producto"
              />
            </FormField>

            <FormField>
              <FormLabel>Precio</FormLabel>
              <Input
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: parseFloat(e.target.value || "0"),
                  })
                }
                placeholder="Precio"
                min="0"
                step="1"
                required
              />
            </FormField>

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProductDialogOpen(false)}
              disabled={isCreatingProduct}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateNewProduct}
              disabled={isCreatingProduct}
            >
              {isCreatingProduct ? "Creando..." : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
