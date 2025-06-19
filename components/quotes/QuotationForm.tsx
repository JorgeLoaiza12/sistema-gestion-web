// web/components/quotes/QuotationForm.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Plus, Loader2, Save, Eye } from "lucide-react";
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
import {
  type QuotationCategory,
  type QuotationItem,
  type Quotation,
  createQuotation,
  updateQuotation,
  getPreviewQuotationPDF,
} from "@/services/quotations";
import { getClients, Client } from "@/services/clients";
import { getProducts, Product } from "@/services/products";
import CategoryForm from "./CategoryForm";
import ClientForm from "./ClientForm";
import { formatCurrency, roundUp } from "@/utils/number-format";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { httpClient } from "@/lib/httpClient";
import { FormSwitch } from "../ui/form-switch"; // Importar el nuevo componente

interface QuotationFormProps {
  quotation: Quotation | null;
  onSave: () => void;
  onCancel: () => void;
  statusOptions: Array<{ value: string; label: string; icon: React.ReactNode }>;
}
const IVA_RATE = 0.19;
const DEFAULT_PROFIT_PERCENTAGE = 35;

export default function QuotationForm({
  quotation,
  onSave,
  onCancel,
  statusOptions,
}: QuotationFormProps) {
  const [title, setTitle] = useState(quotation?.title || "");
  const [description, setDescription] = useState(quotation?.description || "");
  const [clientId, setClientId] = useState<string>(
    quotation?.clientId?.toString() || ""
  );
  const [status, setStatus] = useState(quotation?.status || "SENT");
  const [advancePercentage, setAdvancePercentage] = useState<number>(
    quotation?.advancePercentage !== undefined
      ? quotation.advancePercentage
      : 50
  );
  const [validUntil, setValidUntil] = useState(
    quotation?.validUntil
      ? new Date(quotation.validUntil).toISOString().split("T")[0]
      : ""
  );
  const [categories, setCategories] = useState<QuotationCategory[]>(
    quotation?.categories
      ? JSON.parse(JSON.stringify(quotation.categories))
      : [{ name: "General", items: [] }]
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [disableEmail, setDisableEmail] = useState<boolean>(
    quotation?.disableEmail || false
  );

  // Ref para el contenido del Dialog para el scroll
  const dialogContentRef = useRef<HTMLDivElement>(null);
  // Estado para el ID del último item añadido para hacer scroll
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        setLoadingClients(true);
        setLoadingProducts(true);
        const clientsPromise = getClients()
          .then((data) => {
            setClients(data);
            setLoadingClients(false);
            return data;
          })
          .catch((error) => {
            console.error("Error al cargar clientes:", error);
            setError("Error al cargar los clientes");
            setLoadingClients(false);
            return [];
          });
        const productsPromise = getProducts()
          .then((data) => {
            setProducts(data);
            setLoadingProducts(false);
            return data;
          })
          .catch((error) => {
            console.error("Error al cargar productos:", error);
            setError("Error al cargar los productos");
            setLoadingProducts(false);
            return [];
          });
        await Promise.all([clientsPromise, productsPromise]);
        setError(null);
      } catch (err) {
        console.error("Error loading form data:", err);
        setError("Error al cargar los datos del formulario");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, []);

  useEffect(() => {
    if (quotation) {
      setTitle(quotation.title || "");
      setDescription(quotation.description || "");
      setClientId(quotation.clientId?.toString() || "");
      setStatus(quotation.status || "SENT");
      setAdvancePercentage(
        quotation.advancePercentage !== undefined
          ? quotation.advancePercentage
          : 50
      );
      setValidUntil(
        quotation.validUntil
          ? new Date(quotation.validUntil).toISOString().split("T")[0]
          : ""
      );
      setCategories(
        quotation.categories
          ? JSON.parse(JSON.stringify(quotation.categories))
          : [{ name: "General", items: [] }]
      );
      setDisableEmail(quotation.disableEmail || false);
    } else {
      setTitle("");
      setDescription("");
      setClientId("");
      setStatus("SENT");
      setAdvancePercentage(50);
      setValidUntil("");
      setCategories([{ name: "General", items: [] }]);
      setDisableEmail(false);
    }
  }, [quotation]);

  // Efecto para hacer scroll al último item añadido
  useEffect(() => {
    if (scrollToItemId && dialogContentRef.current) {
      const element = document.getElementById(scrollToItemId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "end" });
        setScrollToItemId(null); // Resetear después de hacer scroll
      }
    }
  }, [scrollToItemId]);

  const addCategory = () => {
    setCategories([...categories, { name: "", items: [] }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index: number, name: string) => {
    const newCategories = [...categories];
    newCategories[index].name = name;
    setCategories(newCategories);
  };

  const addItem = (categoryIndex: number) => {
    setCategories((prevCategories) => {
      const newCategories = [...prevCategories]; // Shallow copy of categories
      const newItem = {
        productId: 0,
        quantity: 1,
        price: undefined,
        markupOverride: undefined,
        product: null as any,
        _tempId: `new-item-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`, // Temp ID for scrolling
      };
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        items: [...newCategories[categoryIndex].items, newItem], // Shallow copy of items
      };
      setScrollToItemId(newItem._tempId); // Set ID to scroll to
      return newCategories;
    });
  };

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    setCategories((prevCategories) => {
      const newCategories = [...prevCategories]; // Shallow copy of categories
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        items: newCategories[categoryIndex].items.filter(
          (_, i) => i !== itemIndex
        ), // Filter creates new array
      };
      return newCategories;
    });
  };

  // REVISIÓN CRÍTICA: La actualización inmutable para evitar pérdida de foco y scroll jump
  const updateItem = (
    categoryIndex: number,
    itemIndex: number,
    field: keyof QuotationItem | "price" | "markupOverride",
    value: any
  ) => {
    setCategories((prevCategories) => {
      return prevCategories.map((cat, catIdx) => {
        if (catIdx === categoryIndex) {
          return {
            ...cat, // Copia superficial de la categoría
            items: cat.items.map((item, itemIdx) => {
              if (itemIdx === itemIndex) {
                const updatedItem = { ...item }; // Copia superficial del ítem

                if (field === "productId") {
                  const selectedProduct = products.find((p) => p.id === value);
                  if (selectedProduct) {
                    updatedItem.product = selectedProduct;
                    updatedItem.price = selectedProduct.unitPrice;
                    updatedItem.markupOverride = selectedProduct.markup;
                    updatedItem.productId = selectedProduct.id;
                    setScrollToItemId(
                      selectedProduct.id?.toString() || updatedItem._tempId
                    ); // Scroll a este ítem si se selecciona un producto
                  } else {
                    updatedItem.product = null;
                    updatedItem.price = undefined;
                    updatedItem.markupOverride = undefined;
                    updatedItem.productId = 0;
                  }
                } else if (field === "price") {
                  updatedItem.price = value as number | undefined;
                } else if (field === "markupOverride") {
                  updatedItem.markupOverride = value as number | undefined;
                } else {
                  (updatedItem as any)[field] = value;
                }
                return updatedItem;
              }
              return item;
            }),
          };
        }
        return cat;
      });
    });
  };

  const handleAddNewProduct = (product: Product) => {
    setProducts((prevProducts) => {
      if (!prevProducts.some((p) => p.id === product.id)) {
        return [...prevProducts, product];
      }
      return prevProducts;
    });
    // Si el producto fue añadido y está asociado a un item, el updateItem ya maneja el scroll
    // Si no está asociado directamente a un item, podrías añadir una lógica aquí para un scroll más general.
  };

  const handleAddNewClient = (client: Client) => {
    if (!client.id) {
      setError("Error al crear el cliente: no se recibió un ID válido");
      return;
    }
    setClients((prevClients) => {
      if (!prevClients.some((c) => c.id === client.id)) {
        return [...prevClients, client];
      }
      return prevClients;
    });
    setClientId(client.id.toString());
    setIsNewClientDialogOpen(false);
  };

  const handleAdvancePercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setAdvancePercentage(value);
    }
  };

  const calculateQuotationTotal = (): number => {
    return categories.reduce((total, category) => {
      return (
        total +
        category.items.reduce((categoryTotal, item) => {
          if (
            !item.productId &&
            !(typeof item.price === "number" && item.quantity > 0)
          )
            return categoryTotal;

          const productDetails = products.find((p) => p.id === item.productId);

          const providerPriceForItem =
            typeof item.price === "number" && !isNaN(item.price)
              ? item.price
              : productDetails
              ? productDetails.unitPrice || 0
              : 0;
          const itemSpecificMarkup =
            typeof item.markupOverride === "number" &&
            !isNaN(item.markupOverride)
              ? item.markupOverride
              : productDetails
              ? productDetails.markup || DEFAULT_PROFIT_PERCENTAGE
              : DEFAULT_PROFIT_PERCENTAGE;
          const markupAmount = Math.ceil(
            (providerPriceForItem * itemSpecificMarkup) / 100
          );
          const finalPrice = providerPriceForItem + markupAmount;
          return categoryTotal + finalPrice * (item.quantity || 1);
        }, 0)
      );
    }, 0);
  };

  const calculateQuotationTotalRevenue = (): number => {
    return categories.reduce((total, category) => {
      return (
        total +
        category.items.reduce((categoryTotal, item) => {
          const productDetails = products.find((p) => p.id === item.productId);
          if (
            !productDetails &&
            !(typeof item.price === "number" && item.quantity > 0)
          )
            return categoryTotal;

          const providerPriceForItem =
            typeof item.price === "number" && !isNaN(item.price)
              ? item.price
              : productDetails
              ? productDetails.unitPrice || 0
              : 0;
          const itemSpecificMarkup =
            typeof item.markupOverride === "number" &&
            !isNaN(item.markupOverride)
              ? item.markupOverride
              : productDetails
              ? productDetails.markup || DEFAULT_PROFIT_PERCENTAGE
              : DEFAULT_PROFIT_PERCENTAGE;
          const markupAmount = Math.ceil(
            (providerPriceForItem * itemSpecificMarkup) / 100
          );
          return categoryTotal + markupAmount * (item.quantity || 1);
        }, 0)
      );
    }, 0);
  };

  const calculateIVA = (): number => {
    const subtotal = calculateQuotationTotal();
    return Math.round(subtotal * IVA_RATE);
  };

  const calculateTotalWithIVA = (): number => {
    const subtotal = calculateQuotationTotal();
    const iva = calculateIVA();
    return subtotal + iva;
  };

  const calculateAdvanceAmount = (): number => {
    return Math.round((calculateTotalWithIVA() * advancePercentage) / 100);
  };

  const calculateRemainingAmount = (): number => {
    return calculateTotalWithIVA() - calculateAdvanceAmount();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSaving && savingProgress < 95) {
      interval = setInterval(() => {
        setSavingProgress((prev) => {
          const increment = (95 - prev) * 0.2;
          return Math.min(prev + increment, 95);
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isSaving, savingProgress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clientId || clientId === "new") {
      setError("Debe seleccionar un cliente");
      return;
    }

    const validCategories = categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) => item.productId && item.productId !== 0
        ),
      }))
      .filter((category) => category.items.length > 0);

    if (validCategories.length === 0) {
      setError("Debe agregar al menos un producto válido a la cotización");
      return;
    }

    const client = clients.find((c) => c.id?.toString() === clientId);
    if (!client) {
      setError("Cliente no encontrado");
      return;
    }

    try {
      setIsSaving(true);
      setSavingProgress(10);
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        setError(`ID de cliente inválido: ${clientId}`);
        setIsSaving(false);
        setSavingProgress(0);
        return;
      }

      const processedCategories = categories
        .map((category) => ({
          name: category.name,
          items: category.items
            .filter((item) => item.productId && item.productId !== 0)
            .map((item) => {
              const productDetails = products.find(
                (p) => p.id === item.productId
              );
              return {
                productId: item.productId!,
                quantity: item.quantity,
                price:
                  typeof item.price === "number"
                    ? item.price
                    : productDetails
                    ? productDetails.unitPrice
                    : undefined,
                markupOverride:
                  typeof item.markupOverride === "number"
                    ? item.markupOverride
                    : undefined,
              };
            }),
        }))
        .filter((category) => category.items.length > 0);

      setSavingProgress(30);
      const quotationData: Quotation = {
        id: quotation?.id,
        clientId: clientIdNum,
        title,
        description,
        status,
        validUntil: validUntil || undefined,
        advancePercentage: advancePercentage,
        categories: processedCategories,
        client: {
          id: client.id!,
          name: client.name,
          email: client.email || "",
        },
        amount: roundUp(calculateTotalWithIVA()),
        disableEmail: disableEmail, // Enviar el nuevo campo
      };
      setSavingProgress(50);
      if (quotation?.id) {
        await updateQuotation(quotation.id, quotationData);
      } else {
        await createQuotation(quotationData);
      }
      setSavingProgress(100);
      setTimeout(() => {
        onSave();
      }, 500);
    } catch (err) {
      console.error("Error al guardar la cotización:", err);
      setError("Error al guardar la cotización");
      setSavingProgress(0);
    } finally {
      if (!error || error === null) {
        // No hay un error real o ya se manejó
      } else {
        setIsSaving(false);
      }
    }
  };

  const handlePreview = async () => {
    setError(null);
    if (!clientId || clientId === "new") {
      setError("Debe seleccionar un cliente para la vista previa.");
      return;
    }
    const client = clients.find((c) => c.id?.toString() === clientId);
    if (!client) {
      setError("Cliente no encontrado para la vista previa.");
      return;
    }

    const validCategoriesForPreview = categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.productId && item.productId !== 0
        ),
      }))
      .filter((cat) => cat.items.length > 0);

    if (validCategoriesForPreview.length === 0) {
      setError("Agregue al menos un producto válido para la vista previa.");
      return;
    }

    const temporaryQuotationDataForPreview: Quotation = {
      id: quotation?.id || `temp-${Date.now()}`,
      clientId: parseInt(clientId),
      title: title || "Vista Previa de Cotización",
      description: description,
      status: status,
      validUntil: validUntil || undefined,
      advancePercentage: advancePercentage,
      categories: validCategoriesForPreview.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          const productDetails = products.find((p) => p.id === item.productId);
          return {
            ...item,
            price:
              typeof item.price === "number"
                ? item.price
                : productDetails?.unitPrice,
            markupOverride:
              typeof item.markupOverride === "number"
                ? item.markupOverride
                : productDetails?.markup,
            product: productDetails
              ? {
                  id: productDetails.id!,
                  name: productDetails.name,
                  price: productDetails.price,
                  markup: productDetails.markup,
                  unitPrice: productDetails.unitPrice,
                }
              : item.product,
          };
        }),
      })),
      client: {
        id: client.id!,
        name: client.name,
        email: client.email || "",
      },
      amount: roundUp(calculateTotalWithIVA()),
      disableEmail: disableEmail, // Incluir el nuevo campo en la vista previa
    };

    setIsPreviewLoading(true);
    try {
      const blobResponse = await getPreviewQuotationPDF(
        temporaryQuotationDataForPreview
      );
      const url = URL.createObjectURL(blobResponse);
      setPreviewPdfUrl(url);
    } catch (err) {
      console.error("Error generando vista previa del PDF:", err);
      setError("No se pudo generar la vista previa del PDF.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  if (isLoading && loadingClients && loadingProducts) {
    return (
      <Dialog open onOpenChange={() => onCancel()}>
        <DialogContent>
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Cargando datos del formulario...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onCancel();
      }}
    >
      <DialogContent
        ref={dialogContentRef}
        className="max-w-7xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {quotation ? "Editar Cotización" : "Nueva Cotización"}
          </DialogTitle>
        </DialogHeader>

        {isSaving && (
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${savingProgress}%` }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Título</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSaving}
              />
            </FormField>

            <FormField>
              <FormLabel>Cliente</FormLabel>
              <div className="flex space-x-2">
                {loadingClients ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={clientId}
                    onValueChange={(value) => {
                      setClientId(value);
                      if (value === "new") {
                        setIsNewClientDialogOpen(true);
                      }
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="flex-grow">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent
                      className="max-h-[300px] overflow-y-auto"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      <SelectItem value="new">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear nuevo cliente
                        </div>
                      </SelectItem>
                      {clients.length > 0 ? (
                        <>
                          <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-100">
                            Clientes ({clients.length})
                          </div>
                          {clients.map((client) => (
                            <SelectItem
                              key={client.id}
                              value={client.id?.toString() || ""}
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <SelectItem value="empty" disabled>
                          No hay clientes disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField>
              <FormLabel>Descripción</FormLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
              />
            </FormField>
            <FormField>
              <FormLabel>Válido hasta</FormLabel>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={isSaving}
              />
            </FormField>
            <FormField>
              <FormLabel>Porcentaje de Abono (%)</FormLabel>
              <Input
                type="number"
                min="0"
                max="100"
                value={advancePercentage}
                onChange={handleAdvancePercentageChange}
                disabled={isSaving}
                className="w-full"
              />
            </FormField>
          </div>
          {quotation && (
            <>
              <FormField>
                <FormLabel>Estado</FormLabel>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </>
          )}
          <FormSwitch
            label="Deshabilitar envío de correo"
            description="Si está activado, no se enviarán correos electrónicos al cliente al crear o actualizar la cotización."
            checked={disableEmail}
            onCheckedChange={setDisableEmail}
            disabled={isSaving}
          />
          <div className="space-y-4">
            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-medium">Productos y Servicios</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
                className="flex items-center"
                disabled={isSaving || loadingProducts}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Categoría</span>
                <span className="sm:hidden">Categoría</span>
              </Button>
            </div>
            {loadingProducts ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              categories.map((category, categoryIndex) => (
                <CategoryForm
                  key={`category-${categoryIndex}-${
                    category.id || categoryIndex
                  }`}
                  category={category}
                  categoryIndex={categoryIndex}
                  products={products}
                  onUpdateCategoryName={updateCategoryName}
                  onRemoveCategory={removeCategory}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onUpdateItem={updateItem}
                  onAddNewProduct={handleAddNewProduct}
                  disabled={isSaving}
                />
              ))
            )}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-green-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Total ganancia:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateQuotationTotalRevenue())}
                  </span>
                </div>
              </div>
              <div className="bg-blue-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Subtotal:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateQuotationTotal())}
                  </span>
                </div>
              </div>
              <div className="bg-amber-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">IVA (19%):</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateIVA())}
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Total con IVA:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateTotalWithIVA())}
                  </span>
                </div>
              </div>
              <div className="bg-purple-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">
                    Abono ({advancePercentage}%):
                  </span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateAdvanceAmount())}
                  </span>
                </div>
              </div>
              <div className="bg-pink-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Saldo pendiente:</span>
                  <span className="text-base md::text-lg font-bold">
                    {formatCurrency(calculateRemainingAmount())}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4 animate-fadeIn">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handlePreview}
              className="w-full sm:w-auto"
              disabled={
                isSaving ||
                isPreviewLoading ||
                loadingClients ||
                loadingProducts
              }
            >
              {isPreviewLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Vista Previa
            </Button>
            <Button
              type="submit"
              disabled={isSaving || loadingClients || loadingProducts}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {savingProgress < 50 ? "Procesando..." : "Guardando..."}
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  {quotation ? "Guardar Cambios" : "Crear Cotización"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
        <ClientForm
          isOpen={isNewClientDialogOpen || clientId === "new"}
          onClose={() => {
            setIsNewClientDialogOpen(false);
            if (clientId === "new") {
              setClientId("");
            }
          }}
          onClientCreated={handleAddNewClient}
        />
      </DialogContent>
      {previewPdfUrl && (
        <Dialog
          open={!!previewPdfUrl}
          onOpenChange={() => setPreviewPdfUrl(null)}
        >
          <DialogContent className="max-w-4xl h-[90vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Vista Previa de Cotización</DialogTitle>
            </DialogHeader>
            <iframe
              src={previewPdfUrl}
              className="w-full h-[calc(90vh-100px)] border-0"
              title="Vista Previa PDF"
            />
            <DialogFooter className="p-4 border-t">
              <Button variant="outline" onClick={() => setPreviewPdfUrl(null)}>
                Cerrar Vista Previa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
