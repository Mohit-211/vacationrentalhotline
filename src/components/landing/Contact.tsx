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
import { isEmail, isUsOrCanadaPhone, US_AND_CANADA } from "@/lib/validation";

const schema = z.object({
  name: z.string().min(1, "Please input your name!"),
  email: z.string().min(1, "Please input your email!").refine(isEmail, "Please input your email!"),
  contact_number: z
    .string()
    .min(1, "Please input your mobile number!")
    .refine(isUsOrCanadaPhone, "Please enter a valid US or Canadian phone number."),
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
    <Section id="contact">
      <Container>
        {/* A gradient panel, like the hero, with the agent standing at its foot. */}
        <div
          data-reveal
          className="relative grid items-end gap-10 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-primary-stronger via-primary-strong to-secondary-strong p-6 shadow-xl sm:p-10 lg:grid-cols-[3fr_2fr] lg:p-12 lg:pb-0"
        >
          <div className="lg:pb-12">
            <SectionHeading
              title={<span className="text-on-strong">Contact Us</span>}
              description={<span className="text-on-strong">Questions about cover for your rental? Send us a message.</span>}
            />
            <form
              method="post"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="mt-8 grid gap-5 rounded-3xl bg-surface p-6 shadow-lg sm:grid-cols-2 sm:p-8"
            >
              <FormField id="contact_name" label="Your Name" required error={errors.name?.message}>
                <Input placeholder="Your Name" autoComplete="name" {...register("name")} />
              </FormField>
              <FormField id="contact_email" label="Email" required error={errors.email?.message}>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
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
                      countries={US_AND_CANADA}
                      addInternationalOption={false}
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
                <Textarea placeholder="How can we help?" rows={4} {...register("requirements")} />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" loading={loading} className="w-full rounded-full px-8 sm:w-auto">
                  Submit
                </Button>
              </div>
            </form>
          </div>
          <Image
            src={supportAgent}
            alt="A smiling support agent wearing a headset"
            sizes="(min-width: 1024px) 26rem, 80vw"
            className="mx-auto hidden w-full max-w-sm drop-shadow-float lg:block"
          />
        </div>
      </Container>
    </Section>
  );
};

export default Contact;
