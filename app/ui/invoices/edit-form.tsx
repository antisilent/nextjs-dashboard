'use client';

import { useActionState } from 'react';

import { CustomerField, InvoiceFormFields } from '@/app/lib/definitions';
import { updateInvoice, State } from '@/app/lib/actions';
import InvoiceForm from './invoice-form';

export default function EditInvoiceForm({
  invoice,
  customers,
}: {
  invoice: InvoiceFormFields;
  customers: CustomerField[];
}) {
  const initialState: State = { message: null, errors: {} };
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);
  const [state, formAction] = useActionState(updateInvoiceWithId, initialState);

  return (
    <InvoiceForm
      customers={customers}
      formAction={formAction}
      state={state}
      invoice={invoice}
    />
  );
}
