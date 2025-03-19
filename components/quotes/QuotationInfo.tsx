import { useState, useEffect } from "react";
import { Quotation, getQuotationById } from "@/services/quotations";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { formatNumber } from "@/utils/number-format";
import { useNotification } from "@/contexts/NotificationContext";

interface QuotationInfoProps {
  quotationId: number;
}

export default function QuotationInfo({ quotationId }: QuotationInfoProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchQuotation = async () => {
      setIsLoading(true);
      try {
        const data = await getQuotationById(quotationId.toString());
        setQuotation(data);
      } catch (error) {
        console.error("Error al cargar los detalles de la cotización:", error);
        addNotification("error", "Error al cargar detalles de la cotización");
      } finally {
        setIsLoading(false);
      }
    };

    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId, addNotification]);

  // Si está cargando o no hay cotización, mostrar un placeholder
  if (isLoading) {
    return (
      <div className="border border-border rounded-md p-4 mb-4 animate-pulse">
        <div className="h-5 w-2/3 bg-muted rounded mb-3"></div>
        <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
        <div className="h-4 w-1/3 bg-muted rounded"></div>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

  return (
    <div className="border border-border rounded-md p-4 mb-4 bg-muted/30">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Información de la Cotización</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              window.open(`/dashboard/quotations/${quotationId}`, "_blank")
            }
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Título:</span>
          <span className="text-sm">{quotation.title}</span>
        </div>

        {quotation.description && (
          <div className="flex justify-between">
            <span className="text-sm font-medium">Descripción:</span>
            <span className="text-sm">{quotation.description}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-sm font-medium">Monto Total:</span>
          <span className="text-sm">${formatNumber(quotation.amount)}</span>
        </div>

        {quotation.validUntil && (
          <div className="flex justify-between">
            <span className="text-sm font-medium">Válida hasta:</span>
            <span className="text-sm">
              {new Date(quotation.validUntil).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-sm font-medium">Cliente:</span>
          <span className="text-sm">{quotation.client?.name}</span>
        </div>
      </div>

      {isExpanded &&
        quotation.categories &&
        quotation.categories.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <h4 className="font-medium mb-2">Categorías y Productos</h4>
            <div className="space-y-3">
              {quotation.categories.map((category) => (
                <div key={category.id} className="bg-background/70 p-2 rounded">
                  <h5 className="font-medium text-sm">{category.name}</h5>
                  {category.items && category.items.length > 0 ? (
                    <table className="w-full text-sm mt-1">
                      <thead className="text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left p-1">Producto</th>
                          <th className="text-right p-1">Cant.</th>
                          <th className="text-right p-1">Precio</th>
                          <th className="text-right p-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-1">{item.product.name}</td>
                            <td className="text-right p-1">{item.quantity}</td>
                            <td className="text-right p-1">
                              ${formatNumber(item.price)}
                            </td>
                            <td className="text-right p-1">
                              ${formatNumber(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sin productos
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
