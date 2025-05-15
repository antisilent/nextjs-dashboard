'use client'

import { useActionState } from 'react';

import { CustomerField } from '@/app/lib/definitions';
import { createInvoice, State } from '@/app/lib/actions';
import InvoiceForm from './invoice-form';

export default function CreateInvoiceForm({ customers }: { customers: CustomerField[] }) {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createInvoice, initialState);

  return (
    <InvoiceForm
      customers={customers}
      formAction={formAction}
      state={state}
    />
  );
}
