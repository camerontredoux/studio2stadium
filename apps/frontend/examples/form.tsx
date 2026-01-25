// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Field,
//   FieldError,
//   FieldGroup,
//   FieldLabel,
// } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectItem,
//   SelectPopup,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardContent } from "@/components/ui/card";
// import * as z from "zod";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { Controller, useForm, type FieldErrors } from "react-hook-form";
// import { toastManager } from "@/components/ui/toast-manager";
// import {
//   InputGroup,
//   InputGroupAddon,
//   InputGroupText,
//   InputGroupTextarea,
// } from "@/components/ui/input-group";
// import { useState } from "react";

// const schema = z.object({
//   name: z.string().min(2, "Minimum 2 characters"),
//   email: z.email(),
//   role: z.enum(["developer", "designer", "manager", "other"], {
//     error: "Select a role",
//   }),
//   newsletter: z.boolean(),
//   test: z.string().min(20, "Minimum 20 characters"),
// });

// export function ExampleForm() {
//   const [loading, setLoading] = useState(false);

//   const { control, handleSubmit, reset } = useForm<z.infer<typeof schema>>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       name: "",
//       email: "",
//       role: undefined,
//       newsletter: false,
//       test: "",
//     },
//   });

//   const onSubmit = async (data: z.infer<typeof schema>) => {
//     setLoading(true);
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     setLoading(false);
//     toastManager.add({
//       title: "Success",
//       description: "Form submitted successfully",
//       data,
//     });
//   };

//   const onError = async (data: FieldErrors<z.infer<typeof schema>>) => {
//     toastManager.add({
//       title: "Error",
//       description: "Form submitted with errors",
//       type: "error",
//       data,
//     });
//   };

//   return (
//     <Card className="w-full sm:max-w-md">
//       <CardContent>
//         <form
//           className="flex w-full flex-col gap-4"
//           onSubmit={handleSubmit(onSubmit, onError)}
//         >
//           <Controller
//             control={control}
//             name="name"
//             render={({ field, fieldState }) => (
//               <Field name={field.name} invalid={fieldState.invalid}>
//                 <FieldLabel>Full Name</FieldLabel>
//                 <Input {...field} placeholder="John Doe" />
//                 <FieldError error={fieldState.error} />
//               </Field>
//             )}
//           />

//           <Controller
//             control={control}
//             name="email"
//             render={({ field, fieldState }) => (
//               <Field name={field.name} invalid={fieldState.invalid}>
//                 <FieldLabel>Email</FieldLabel>
//                 <Input {...field} placeholder="john@example.com" />
//                 <FieldError error={fieldState.error} />
//               </Field>
//             )}
//           />

//           <Controller
//             control={control}
//             name="role"
//             render={({ field, fieldState }) => (
//               <Field name={field.name} invalid={fieldState.invalid}>
//                 <FieldLabel>Role</FieldLabel>
//                 <Select
//                   value={field.value ?? null}
//                   onValueChange={field.onChange}
//                   items={[
//                     { label: "Select your role", value: null },
//                     { label: "Developer", value: "developer" },
//                     { label: "Designer", value: "designer" },
//                     { label: "Product Manager", value: "manager" },
//                     { label: "Other", value: "other" },
//                   ]}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectPopup>
//                     <SelectItem value="developer">Developer</SelectItem>
//                     <SelectItem value="designer">Designer</SelectItem>
//                     <SelectItem value="manager">Product Manager</SelectItem>
//                     <SelectItem value="other">Other</SelectItem>
//                   </SelectPopup>
//                 </Select>
//                 <FieldError error={fieldState.error} />
//               </Field>
//             )}
//           />

//           <Controller
//             control={control}
//             name="newsletter"
//             render={({ field, fieldState }) => {
//               return (
//                 <Field name={field.name} invalid={fieldState.invalid}>
//                   <FieldGroup>
//                     <div className="flex items-center gap-2">
//                       <Checkbox
//                         name={field.name}
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                       <FieldLabel className="cursor-pointer">
//                         Subscribe to newsletter
//                       </FieldLabel>
//                     </div>
//                   </FieldGroup>
//                 </Field>
//               );
//             }}
//           />

//           <Controller
//             control={control}
//             name="test"
//             render={({ field, fieldState }) => {
//               return (
//                 <Field name={field.name} invalid={fieldState.invalid}>
//                   <FieldLabel>Test</FieldLabel>
//                   <InputGroup>
//                     <InputGroupTextarea {...field} placeholder="Test" />
//                     <InputGroupAddon align="block-end">
//                       <InputGroupText className="tabular-nums">
//                         {field.value.length}/100 characters
//                       </InputGroupText>
//                     </InputGroupAddon>
//                   </InputGroup>
//                   <FieldError error={fieldState.error} />
//                 </Field>
//               );
//             }}
//           />

//           <FieldGroup>
//             <Field orientation="responsive">
//               <Button disabled={loading} type="submit">
//                 Submit
//               </Button>
//               <Button
//                 disabled={loading}
//                 type="button"
//                 variant="outline"
//                 onClick={() => reset()}
//               >
//                 Cancel
//               </Button>
//             </Field>
//           </FieldGroup>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
