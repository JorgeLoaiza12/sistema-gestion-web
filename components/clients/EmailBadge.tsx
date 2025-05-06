import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mail } from 'lucide-react';

interface EmailBadgeProps {
  emails: string[];
}

/**
 * Componente para mostrar un indicador de múltiples correos electrónicos
 * con un tooltip que muestra todos los correos disponibles
 */
export const EmailBadge: React.FC<EmailBadgeProps> = ({ emails }) => {
  // Filtrar emails válidos (no vacíos)
  const validEmails = emails.filter(email => email && email.trim() !== '');
  
  if (validEmails.length <= 1) {
    return null; // No mostrar el badge si solo hay un email o ninguno
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Mail className="h-3 w-3 mr-1" />
            {validEmails.length}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-2 max-w-xs">
          <p className="font-semibold mb-1">Correos electrónicos:</p>
          <ul className="text-xs space-y-1">
            {validEmails.map((email, index) => (
              <li key={index} className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                {email}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EmailBadge;