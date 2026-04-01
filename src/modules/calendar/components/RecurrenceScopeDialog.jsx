import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";

export default function RecurrenceScopeDialog({
  open,
  action,
  onSelect,
  onCancel,
}) {
  const title =
    action === "delete"
      ? "¿Qué eventos quieres eliminar?"
      : "¿Qué eventos quieres editar?";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => onSelect("single")}>
            Solo este evento
          </Button>
          <Button variant="outline" onClick={() => onSelect("future")}>
            Este y los siguientes
          </Button>
          <Button variant="outline" onClick={() => onSelect("all")}>
            Todos los eventos
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
