"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, EllipsisVertical, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
import { deleteProperties, getProperty } from "@/lib/api/properties";
import { addNote, deleteNote, updateNote } from "@/lib/api/notes";
import type { NoteInput, PropertyWithNotes } from "@/lib/api/types";
import { findCountry, findRegion } from "@/lib/locations";
import { useIsClient } from "@/lib/useIsClient";

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
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
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
    try {
      await deleteNote(id, noteId);
      toast.success("Note deleted successfully");
      loadProperty(id, setData);
    } catch {
      // The API client has already shown the error.
    }
  };

  const handleEditProperty = () => router.push(`/properties/${id}/edit`);
  const handleDeleteProperty = () => {
    deleteProperties([id])
      .then(() => {
        toast.success("Property deleted.");
        router.push("/dashboard");
      })
      .catch(() => {
        // The API client has already shown the error.
      });
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
    ["Subscription Purchased", data ? (data.status === "active" ? "Active Properties" : "Inactive Properties") : "---"],
    ["Expiry Date", data?.subscriptionEndsAt?.split("T")[0] ?? "---"],
    ["Validity", "1 year"],
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
                <DropdownMenuItem onSelect={handleEditProperty}>
                  <Pencil aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                {data?.status !== "active" && (
                  <DropdownMenuItem variant="danger" onSelect={handleDeleteProperty}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

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
                    <DropdownMenuItem variant="danger" onSelect={() => handleDeleteNote(item.id)}>
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
            <Button type="submit" form="note-form">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyDetails;
