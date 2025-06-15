// web/components/quotes/CategoryForm.tsx
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import {
  Trash,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DEFAULT_PROFIT_PERCENTAGE = 35;

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
    field: keyof QuotationItem | "price" | "markupOverride", // <-- CORREGIDO
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
  const [isExpanded, setIsExpanded] = useState(true);
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [itemIndexForNewProduct, setItemIndexForNewProduct] = useState<
    number | null
  >(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: "",
    markup: DEFAULT_PROFIT_PERCENTAGE.toString(),
    imageUrl: "",
  });

  useEffect(() => {
    setLocalProducts([...products]);
  }, [products]);

  const calculateCategoryTotal = (): number => {
    return roundUp(
      category.items.reduce((total, item) => {
        const providerPriceForItem =
          typeof item.price === "number" && !isNaN(item.price)
            ? item.price
            : item.product
            ? item.product.unitPrice || 0
            : 0;

        const itemSpecificMarkup =
          typeof item.markupOverride === "number" && !isNaN(item.markupOverride)
            ? item.markupOverride
            : item.product
            ? item.product.markup || DEFAULT_PROFIT_PERCENTAGE
            : DEFAULT_PROFIT_PERCENTAGE;

        const markupAmountForItem = Math.ceil(
          (providerPriceForItem * itemSpecificMarkup) / 100
        );
        const finalPriceForItem = providerPriceForItem + markupAmountForItem;
        return total + finalPriceForItem * (item.quantity || 1);
      }, 0)
    );
  };

  const hasItems = category.items.length > 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
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
      const unitPrice = Math.floor(parseFloat(formData.unitPrice));
      const markup = parseFloat(formData.markup);
      const markupAmount = Math.ceil((unitPrice * markup) / 100);
      const finalPrice = unitPrice + markupAmount;
      const productFormData = new FormData();
      productFormData.append("name", formData.name);
      productFormData.append("description", formData.description || "");
      productFormData.append("unitPrice", unitPrice.toString());
      productFormData.append("markup", markup.toString());
      productFormData.append("price", finalPrice.toString());
      if (formData.imageUrl && formData.imageUrl.startsWith("data:image")) {
        const blob = await fetch(formData.imageUrl).then((r) => r.blob());
        const imageFile = new File([blob], "product-image.png", {
          type: "image/png",
        });
        productFormData.append("image", imageFile);
      }
      const result = await createProduct(productFormData);
      const newProduct = result.product;
      const updatedProducts = [...localProducts, newProduct];
      setLocalProducts(updatedProducts);
      onAddNewProduct(newProduct);
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
        newProduct.unitPrice
      );
      onUpdateItem(
        categoryIndex,
        itemIndexForNewProduct,
        "markupOverride",
        newProduct.markup
      );
      onUpdateItem(
        categoryIndex,
        itemIndexForNewProduct,
        "product",
        newProduct
      );
      addNotification("success", "Producto creado correctamente");
      setIsNewProductDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        unitPrice: "",
        markup: DEFAULT_PROFIT_PERCENTAGE.toString(),
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

  const handleCloseProductDialog = () => {
    setIsNewProductDialogOpen(false);
    setItemIndexForNewProduct(null);
    setProductFormError(null);
  };

  const QuotationItemRow = ({
    item,
    itemIndex,
  }: {
    item: QuotationItem;
    itemIndex: number;
  }) => {
    const [priceInputValue, setPriceInputValue] = useState<string>("");
    const [markupInputValue, setMarkupInputValue] = useState<string>("");
    const [openProductSelect, setOpenProductSelect] = useState(false);

    useEffect(() => {
      let initialPrice = "";
      if (item.price !== undefined) {
        initialPrice = String(item.price);
      } else if (item.product && item.product.unitPrice !== undefined) {
        initialPrice = String(item.product.unitPrice);
      }
      setPriceInputValue(initialPrice);

      let initialMarkup = "";
      // <-- INICIO DE CORRECCIÓN
      if (item.markupOverride !== undefined && item.markupOverride !== null) {
        initialMarkup = String(item.markupOverride);
      } else if (item.product && item.product.markup !== undefined) {
        initialMarkup = String(item.product.markup);
      } else {
        initialMarkup = String(DEFAULT_PROFIT_PERCENTAGE);
      }
      // <-- FIN DE CORRECCIÓN
      setMarkupInputValue(initialMarkup);
    }, [item.price, item.markupOverride, item.product?.id]); // <-- CORREGIDO

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPriceInputValue(e.target.value);
    };

    const handlePriceBlur = () => {
      const value = priceInputValue;
      if (value.trim() === "") {
        onUpdateItem(categoryIndex, itemIndex, "price", undefined);
        if (item.product && item.product.unitPrice !== undefined) {
          setPriceInputValue(String(item.product.unitPrice));
        }
      } else {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          onUpdateItem(categoryIndex, itemIndex, "price", roundUp(num));
        } else {
          let fallbackPrice = "";
          if (item.price !== undefined) {
            fallbackPrice = String(item.price);
          } else if (item.product && item.product.unitPrice !== undefined) {
            fallbackPrice = String(item.product.unitPrice);
          }
          setPriceInputValue(fallbackPrice);
        }
      }
    };

    const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMarkupInputValue(e.target.value);
    };

    const handleMarkupBlur = () => {
      const value = markupInputValue;
      if (value.trim() === "") {
        onUpdateItem(categoryIndex, itemIndex, "markupOverride", undefined); // <-- CORREGIDO
        if (item.product && item.product.markup !== undefined) {
          setMarkupInputValue(String(item.product.markup));
        } else {
          setMarkupInputValue(String(DEFAULT_PROFIT_PERCENTAGE));
        }
      } else {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          onUpdateItem(categoryIndex, itemIndex, "markupOverride", num); // <-- CORREGIDO
        } else {
          let fallbackMarkup = "";
          if (item.markupOverride !== undefined) {
            // <-- CORREGIDO
            fallbackMarkup = String(item.markupOverride); // <-- CORREGIDO
          } else if (item.product && item.product.markup !== undefined) {
            fallbackMarkup = String(item.product.markup);
          } else {
            fallbackMarkup = String(DEFAULT_PROFIT_PERCENTAGE);
          }
          setMarkupInputValue(fallbackMarkup);
        }
      }
    };

    const currentProviderPrice =
      parseFloat(priceInputValue) ||
      (item.product ? item.product.unitPrice || 0 : 0);
    const currentMarkupPercentage =
      parseFloat(markupInputValue) ||
      (item.product
        ? item.product.markup || DEFAULT_PROFIT_PERCENTAGE
        : DEFAULT_PROFIT_PERCENTAGE);
    const markupAmountForItem = Math.ceil(
      (currentProviderPrice * currentMarkupPercentage) / 100
    );
    const finalPriceForItem = currentProviderPrice + markupAmountForItem;
    const lineTotalWithMarkup = finalPriceForItem * (item.quantity || 1);

    return (
      <div
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
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Producto {itemIndex + 1}</h4>
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
          <div className="mb-3">
            <FormLabel className="text-xs">
              Producto{" "}
              {(!item.productId || item.productId === 0) && (
                <span className="text-red-500 text-xs ml-1">*Requerido</span>
              )}
            </FormLabel>
            <Popover
              open={openProductSelect}
              onOpenChange={setOpenProductSelect}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProductSelect}
                  className="w-full justify-between"
                  disabled={disabled}
                >
                  {item.product?.name || "Seleccionar producto..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar producto..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-3 px-4 text-center space-y-2">
                        <p className="text-sm">No se encontraron productos</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setItemIndexForNewProduct(itemIndex);
                            setIsNewProductDialogOpen(true);
                            setOpenProductSelect(false);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar nuevo producto
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup heading="Productos disponibles">
                      {localProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            onUpdateItem(
                              categoryIndex,
                              itemIndex,
                              "productId",
                              product.id
                            );
                            setOpenProductSelect(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              item.productId === product.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setItemIndexForNewProduct(itemIndex);
                          setIsNewProductDialogOpen(true);
                          setOpenProductSelect(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar nuevo producto
                      </Button>
                    </div>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {(!item.productId || item.productId === 0) && (
              <p className="text-red-500 text-xs mt-1">
                Por favor, seleccione un producto
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2 items-end">
            <FormField>
              <FormLabel className="text-xs">Cantidad</FormLabel>
              <Input
                type="number"
                min="1"
                value={item.quantity || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  onUpdateItem(categoryIndex, itemIndex, "quantity", value);
                }}
                className="h-9"
                required
                disabled={disabled}
              />
            </FormField>
            <FormField>
              <FormLabel className="text-xs">Precio Proveedor</FormLabel>
              <Input
                type="text"
                value={priceInputValue}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                className="h-9"
                placeholder="Costo"
                disabled={disabled || !item.product}
              />
            </FormField>
            <FormField>
              <FormLabel className="text-xs">% Ganancia</FormLabel>
              <Input
                type="text"
                value={markupInputValue}
                onChange={handleMarkupChange}
                onBlur={handleMarkupBlur}
                className="h-9"
                placeholder="Ej: 35"
                disabled={disabled || !item.product}
              />
            </FormField>
            <FormField>
              <FormLabel className="text-xs">Precio Venta Unit.</FormLabel>
              <Input
                value={formatCurrency(finalPriceForItem)}
                className="h-9 bg-gray-50"
                readOnly
                disabled
              />
            </FormField>
            <FormField>
              <FormLabel className="text-xs">Total Línea</FormLabel>
              <Input
                value={formatCurrency(lineTotalWithMarkup)}
                className="h-9 bg-gray-50 font-medium"
                readOnly
                disabled
              />
            </FormField>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center flex-1">
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
      <div className={`space-y-3 ${isExpanded ? "block" : "hidden sm:block"}`}>
        {category.items.map((item, itemIndex) => (
          <QuotationItemRow
            key={
              (item as any)._tempId ||
              item.id?.toString() ||
              `item-row-${categoryIndex}-${itemIndex}`
            }
            item={item}
            itemIndex={itemIndex}
          />
        ))}
        {!hasItems && (
          <div className="text-sm text-muted-foreground text-center py-3">
            No hay productos en esta categoría
          </div>
        )}
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
