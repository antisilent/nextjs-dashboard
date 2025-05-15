'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, {
    message: 'Please enter an amount greater than $0.',
  }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const InvoiceForm = FormSchema.omit({ id: true, date: true });
function isValidInvoiceForm(formData: FormData) {
  const validatedFields = InvoiceForm.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  return validatedFields;
}

async function handleInvoiceOperation(
  formData: FormData,
  id?: string
): Promise<State> {
  const operation = !!id ? 'update' : 'create';
  const validatedFields = isValidInvoiceForm(formData);

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: `Missing Fields. Failed to ${operation === 'create' ? 'Create' : 'Update'} Invoice.`,
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.floor(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    if (operation === 'create') {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } else if (id) { // Ensure id exists for update operation
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } else {
      throw new Error('ID is required for update operation');
    }
  } catch (error) {
    console.error(error);
    return {
      message: `Database Error: Failed to ${operation === 'create' ? 'Create' : 'Update'} Invoice.`,
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function createInvoice(prevState: State, formData: FormData) {
  return handleInvoiceOperation(formData);
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  return handleInvoiceOperation(formData, id);
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
