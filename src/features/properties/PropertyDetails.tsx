"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, CircleAlert, EllipsisVertical, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { cancelRenewal } from "@/lib/api/checkout";
import { deleteProperties, getProperty } from "@/lib/api/properties";
import { addNote, deleteNote, updateNote } from "@/lib/api/notes";
import type { NoteInput, PropertyWithNotes } from "@/lib/api/types";
import { CheckoutDialog, useCheckout } from "@/features/checkout/CheckoutDialog";
import { coverLabel, priceSummary } from "@/features/dashboard/Dashboard";
import { findCountry, findRegion } from "@/lib/locations";
import { useIsClient } from "@/lib/useIsClient";
import { formatDate } from "@/lib/dates";

// The same rule as the API's (src/lib/schemas/note.ts).
const noteSchema = z.object({
  body: z.string().trim().min(1, "Please enter a note").max(5000, "A note can be at most 5,000 characters."),
});

const loadProperty = async (id: string, setData: (property: PropertyWithNotes) => void) => {
  try {
    const res = await getProperty(id);
    setData(res.data.data);
  } catch {
    // The API client has already shown the error.
  }
};

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold break-words">{children}</dd>
    </div>
  );
}

const PropertyDetails = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isClient = useIsClient();
  const [data, setData] = useState<PropertyWithNotes>();
  const [loaded, setLoaded] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  // Deleting the property or one of its notes asks first.
  const [toDelete, setToDelete] = useState<{ noteId: string } | "property">();
  const [deleting, setDeleting] = useState(false);
  const checkout = useCheckout(() => loadProperty(id, setData));
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteInput>({ resolver: zodResolver(noteSchema), mode: "onChange", defaultValues: { body: "" } });

  useEffect(() => {
    if (id) {
      loadProperty(id, setData).finally(() => setLoaded(true));
    }
  }, [id]);

  const toggleNoteDialog = useCallback(
    (visible = false, noteId: string | null = null) => {
      setNoteDialogOpen(visible);
      setEditingNoteId(noteId);
      if (!visible) reset({ body: "" });
    },
    [reset]
  );

  const saveNote = async (values: NoteInput) => {
    try {
      if (editingNoteId) {
        await updateNote(id, editingNoteId, values.body);
        toast.success("Note updated.");
      } else {
        await addNote(id, values.body);
        toast.success("Your note has been added to the property.");
      }
      toggleNoteDialog(false);
      loadProperty(id, setData);
    } catch {
      // The API client has already shown the error.
    }
  };
  const submitNoteForm = handleSubmit(saveNote);

  const handleEditNote = (noteId: string) => {
    const note = data?.notes.find((item) => item.id === noteId);
    if (!note) return;
    setValue("body", note.body);
    toggleNoteDialog(true, noteId);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(id, noteId);
    toast.success("Note deleted successfully");
    setToDelete(undefined);
    loadProperty(id, setData);
  };

  const confirmCancelRenewal = async () => {
    setCancelLoading(true);
    try {
      await cancelRenewal(id);
      toast.success("Renewal cancelled. The property stays covered until its paid year ends.");
      setCancelOpen(false);
      loadProperty(id, setData);
    } catch {
      // The API client has already shown the error.
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDeleteProperty = async () => {
    await deleteProperties([id]);
    toast.success("Property deleted.");
    router.push("/dashboard");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete === "property") await handleDeleteProperty();
      else await handleDeleteNote(toDelete.noteId);
    } catch {
      // The API client has already shown the error.
    } finally {
      setDeleting(false);
    }
  };

  const value = (v: unknown) => (v === undefined || v === null ? "---" : String(v));
  const status = !data ? (
    "---"
  ) : data.status === "active" ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="warning">Inactive</Badge>
  );
  const country = findCountry(data?.countryCode);

  const propertyRows: [string, ReactNode][] = [
    ["Property Owner Name", value(data?.ownerName)],
    ["Address line 1", value(data?.addressLine1)],
    ["Address line 2", value(data?.addressLine2)],
    ["Status", status],
    ["Email 1", value(data?.ownerEmail)],
    ["Email 2", value(data?.ownerAltEmail)],
    ["Phone Number 1", value(data?.ownerPhone)],
    ["Phone Number 2", value(data?.ownerAltPhone)],
    ["Country", value(country?.name ?? data?.countryCode)],
    [country?.regionLabel ?? "State", value(findRegion(data?.countryCode, data?.regionCode)?.name ?? data?.regionCode)],
    ["City", value(data?.city)],
    [country?.postalCodeLabel ?? "Zip Code", value(data?.postalCode)],
  ];
  const subscriptionRows: [string, ReactNode][] = [
    // Purchased once a year has been paid for, even if it has since ended.
    ["Subscription Purchased", !data ? "---" : data.complimentary ? "Free cover" : data.subscriptionEndsAt ? "Yes" : "No"],
    ["Expiry Date", data?.subscriptionEndsAt ? formatDate(data.subscriptionEndsAt) : "---"],
    [
      "Validity",
      data?.complimentary
        ? "Free cover (no charge)"
        : data?.status === "active"
          ? `1 year, ${coverLabel(data).replace(/^\w/, (letter) => letter.toLowerCase())}`
          : "1 year",
    ],
  ];
  const notes = data?.notes ?? [];

  const skeletonGrid = (count: number) => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-40" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Property Details"
        back={
          <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard" className="mt-0.5 -ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        }
        actions={
          <>
            {data?.status === "inactive" && (
              <Button variant="secondary" disabled={checkout.starting} onClick={() => checkout.start([id])}>
                Activate
              </Button>
            )}
            <Button variant="outline" onClick={() => toggleNoteDialog(true)}>
              <Plus aria-hidden="true" />
              Add a Note
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  Action
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href={`/properties/${id}/edit`}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {data?.status === "active" && data.autoRenews && (
                  <DropdownMenuItem variant="danger" onSelect={() => setCancelOpen(true)}>
                    Cancel renewal
                  </DropdownMenuItem>
                )}
                {data?.canDelete && (
                  <DropdownMenuItem variant="danger" onSelect={() => setToDelete("property")}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {data?.status === "inactive" && (
        <Alert variant="info">
          <CircleAlert aria-hidden="true" />
          <div>
            <p className="font-semibold">Not covered yet</p>
            <p>We don&apos;t answer calls for this property until it&apos;s activated. {priceSummary()}</p>
          </div>
        </Alert>
      )}

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">Property</h2>
        {loaded ? (
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {propertyRows.map(([label, content]) => (
              <DetailItem key={label} label={label}>
                {content}
              </DetailItem>
            ))}
          </dl>
        ) : (
          skeletonGrid(9)
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">Subscription Details</h2>
        {loaded ? (
          <dl className="grid gap-6 sm:grid-cols-3">
            {subscriptionRows.map(([label, content]) => (
              <DetailItem key={label} label={label}>
                {content}
              </DetailItem>
            ))}
          </dl>
        ) : (
          skeletonGrid(3)
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Notes</h2>
        {isClient && loaded && notes.length > 0 ? (
          <ul className="grid gap-3">
            {notes.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border bg-canvas p-4"
              >
                <p className="leading-relaxed whitespace-pre-wrap">{item.body}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Note actions" className="shrink-0">
                      <EllipsisVertical aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleEditNote(item.id)}>
                      <Pencil aria-hidden="true" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="danger" onSelect={() => setToDelete({ noteId: item.id })}>
                      <Trash2 aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        ) : loaded ? (
          <EmptyState
            icon={<StickyNote aria-hidden="true" />}
            title="No notes yet"
            description="Add a note to keep track of anything about this property."
            className="py-8"
          />
        ) : (
          <Skeleton className="h-16 w-full" />
        )}
      </section>

      <CheckoutDialog {...checkout.dialog} />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel renewal?"
        description={`This property stays covered until its paid year ends (${data?.subscriptionEndsAt ? formatDate(data.subscriptionEndsAt) : ""}), then stops. You won't be charged again for it.`}
        confirmLabel="Cancel renewal"
        cancelLabel="Keep renewing"
        variant="danger"
        loading={cancelLoading}
        onConfirm={confirmCancelRenewal}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(undefined)}
        title={toDelete === "property" ? "Delete this property?" : "Delete this note?"}
        description={
          toDelete === "property"
            ? `${data?.fullAddress ?? "This property"} and its notes will be deleted. This can't be undone.`
            : "The note will be deleted. This can't be undone."
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <Dialog open={noteDialogOpen} onOpenChange={(open) => !open && toggleNoteDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isClient && editingNoteId ? "Edit Note" : "Add a Note"}</DialogTitle>
          </DialogHeader>
          <form id="note-form" method="post" noValidate onSubmit={submitNoteForm}>
            <FormField id="note_body" error={errors.body?.message}>
              <Textarea rows={4} placeholder="Enter your note here" aria-label="Note" {...register("body")} />
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => toggleNoteDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" form="note-form" loading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
