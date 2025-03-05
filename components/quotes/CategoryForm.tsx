import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Trash, Plus } from "lucide-react";
import { QuotationCategory, QuotationItem } from "@/services/quotations";
import { Product } from "@/services/products";
import ProductItemForm from "./ProductItemForm";
import { formatCurrency, roundUp } from "@/utils/number-format";

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
}: CategoryFormProps) {
  // Calcular el total de la categoría
  const calculateCategoryTotal = (): number => {
    return roundUp(
      category.items.reduce((total, item) => {
        const providerPrice =
          item.price || (item.product ? item.product.price : 0);
        const finalPrice = Math.ceil(providerPrice + providerPrice * 0.35); // Redondear hacia arriba
        return total + finalPrice * item.quantity;
      }, 0)
    );
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <FormField className="flex-grow mr-4">
          <FormLabel>Nombre de Categoría</FormLabel>
          <Input
            value={category.name}
            onChange={(e) =>
              onUpdateCategoryName(categoryIndex, e.target.value)
            }
            placeholder="Ej: Servicios, Productos, etc."
            required
          />
        </FormField>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveCategory(categoryIndex)}
          className="mt-6"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {category.items.map((item, itemIndex) => (
          <ProductItemForm
            key={itemIndex}
            categoryIndex={categoryIndex}
            itemIndex={itemIndex}
            item={item}
            products={products}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
            onAddNewProduct={onAddNewProduct}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddItem(categoryIndex)}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>

        <div className="flex justify-end mt-4">
          <div className="bg-muted-foreground/10 px-4 py-2 rounded">
            <span>Total de la categoría: </span>
            <span className="font-bold">
              {formatCurrency(calculateCategoryTotal())}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
