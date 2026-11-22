"use client";

import { useState } from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import supportAgent from "@public/assets/support-agent.png";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Textarea } from "@/components/ui/Textarea";
import { sendContactMessage } from "@/lib/api/contact";
import { isEmail, isValidPhone } from "@/lib/validation";

const schema = z.object({
  name: z.string().min(1, "Please input your name!"),
  email: z.string().min(1, "Please input your email!").refine(isEmail, "Please input your email!"),
  contact_number: z
    .string()
    .min(1, "Please input your mobile number!")
    .refine(isValidPhone, "Invalid phone number."),
  requirements: z.string().min(1, "Please input your message!"),
});
type ContactValues = z.infer<typeof schema>;

const emptyForm: ContactValues = { name: "", email: "", contact_number: "", requirements: "" };

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: emptyForm });

  const onSubmit = (values: ContactValues) => {
    setLoading(true);
    sendContactMessage({
      name: values.name,
      email: values.email,
      phone: values.contact_number,
      message: values.requirements,
    })
      .then(() => {
        toast.success("Your query has been submitted.");
        reset(emptyForm);
      })
      .catch(() => {
        // The API client has already shown the error.
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Section id="contact" className="bg-surface">
      <Container>
        <SectionHeading align="center" title="Contact Us" />
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[3fr_2fr]">
          <form
            method="post"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-5 rounded-2xl border border-border bg-canvas p-6 shadow-sm sm:grid-cols-2 sm:p-8"
          >
            <FormField id="contact_name" label="Your Name" required error={errors.name?.message}>
              <Input placeholder="Your Name" autoComplete="name" {...register("name")} />
            </FormField>
            <FormField id="contact_email" label="Email" required error={errors.email?.message}>
              <Input type="email" placeholder="Your Email" autoComplete="email" {...register("email")} />
            </FormField>
            <Controller
              control={control}
              name="contact_number"
              render={({ field }) => (
                <FormField
                  id="contact_number"
                  label="Mobile Number"
                  required
                  error={errors.contact_number?.message}
                  className="sm:col-span-2"
                >
                  <PhoneInput
                    placeholder="Enter Mobile Number"
                    defaultCountry="US"
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? "")}
                    onBlur={field.onBlur}
                  />
                </FormField>
              )}
            />
            <FormField
              id="contact_requirements"
              label="Message"
              required
              error={errors.requirements?.message}
              className="sm:col-span-2"
            >
              <Textarea placeholder="Message" rows={4} {...register("requirements")} />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
                Submit
              </Button>
            </div>
          </form>
          <Image
            src={supportAgent}
            alt="Contact Us"
            sizes="(min-width: 1024px) 26rem, 80vw"
            className="mx-auto hidden w-full max-w-sm lg:block"
          />
        </div>
      </Container>
    </Section>
  );
};

export default Contact;
