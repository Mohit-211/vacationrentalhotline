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
import { addNote, deleteNote, getNote, updateNote } from "@/lib/api/notes";
import type { Id, NoteInput, Property } from "@/lib/api/types";
import { useIsClient } from "@/lib/useIsClient";

const noteSchema = z.object({ notes: z.string().min(1, "Please enter a note") });

const loadProperty = async (id: Id, setData: (property: Property) => void) => {
  try {
    const res = await getProperty(id);
    setData(res.data.data);
  } catch (e) {
    console.error(e);
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
  const [data, setData] = useState<Partial<Property>>({});
  const [loaded, setLoaded] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<Id | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteInput>({ resolver: zodResolver(noteSchema), mode: "onChange", defaultValues: { notes: "" } });

  useEffect(() => {
    if (id) {
      loadProperty(id, setData).finally(() => setLoaded(true));
    }
  }, [id]);

  const toggleNoteDialog = useCallback(
    (visible = false, noteId: Id | null = null) => {
      setNoteDialogOpen(visible);
      setEditingNoteId(noteId);
      if (!visible) reset({ notes: "" });
    },
    [reset]
  );

  const saveNote = async (values: NoteInput) => {
    try {
      const apiCall = isClient && editingNoteId ? updateNote(editingNoteId, values) : addNote(id, values);
      const res = await apiCall;
      toast.success(res.data.message);
      toggleNoteDialog(false);
      loadProperty(id, setData);
    } catch (e) {
      console.error(e);
    }
  };
  const submitNoteForm = handleSubmit(saveNote, (e) => console.error(e));

  const handleEditNote = async (noteId: Id) => {
    try {
      const res = await getNote(noteId);
      setValue("notes", res.data.data.notes);
      toggleNoteDialog(true, noteId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (noteId: Id) => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully");
      loadProperty(id, setData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditProperty = () => router.push(`/properties/${id}/edit`);
  const handleDeleteProperty = () => {
    const formData = {
      property_ids: [id],
    };
    deleteProperties(formData)
      .then((res) => {
        toast.success(res?.data?.message);
        router.push("/dashboard");
      })
      .catch((e) => {
        console.log(e, "error");
      });
  };

  const value = (v: unknown) => (v === undefined || v === null ? "---" : String(v));
  const status =
    data?.subscription_status === "ACTIVATE" ? (
      <Badge variant="success">Active</Badge>
    ) : data?.subscription_status === "DEACTIVATE" ? (
      <Badge variant="warning">Inactive</Badge>
    ) : (
      "---"
    );

  const propertyRows: [string, ReactNode][] = [
    ["Property Owner Name", value(data?.property_owner_name)],
    ["Address line 1", value(data?.address_line_1)],
    ["Address line 2", value(data?.address_line_2)],
    ["Status", status],
    ["Email 1", value(data?.property_owner_email_1)],
    ["Email 2", value(data?.property_owner_email_2)],
    ["Phone Number 1", value(data?.property_owner_mobile_number_1)],
    ["Phone Number 2", value(data?.property_owner_mobile_number_2)],
    ["Country", value(data?.country)],
    ["State", value(data?.state)],
    ["City", value(data?.city)],
    ["Zip Code", value(data?.zip_code)],
  ];
  const subscriptionRows: [string, ReactNode][] = [
    [
      "Subscription Purchased",
      data?.subscription_status
        ? data.subscription_status === "DEACTIVATE"
          ? "Inactive Properties"
          : "Active Properties"
        : "---",
    ],
    ["Expiry Date", data?.subscription_end_date?.split("T")[0] ?? "---"],
    ["Validity", value(data?.validity)],
  ];
  const notes = (data?.property_notes ?? []).filter((item) => item?.notes);

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
                {data?.payment_status !== "SUCCESS" && (
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
            {notes.map((item, index) => (
              <li
                key={index}
                className="flex items-start justify-between gap-4 rounded-xl border border-border bg-canvas p-4"
              >
                <p className="leading-relaxed whitespace-pre-wrap">{item.notes}</p>
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
          <form id="note-form" noValidate onSubmit={submitNoteForm}>
            <FormField id="note_notes" error={errors.notes?.message}>
              <Textarea rows={4} placeholder="Enter your note here" aria-label="Note" {...register("notes")} />
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
