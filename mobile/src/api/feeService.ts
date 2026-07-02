import API from './api';

export interface FeeInstallment {
  _id?: string;
  name: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  late_fee_applied: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
  paid_date?: string | null;
}

export interface FeeDiscount {
  label: string;
  type: string;
  amount: number;
  percentage: number;
}

export interface StudentFeeRecord {
  _id: string;
  academic_year: string;
  gross_amount: number;
  total_discount: number;
  net_payable: number;
  total_paid: number;
  total_due: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  installments: FeeInstallment[];
  discounts: FeeDiscount[];
}

export interface FeePaymentAllocation {
  installment_name: string;
  amount: number;
}

export interface FeePayment {
  _id: string;
  receipt_number: string;
  amount: number;
  payment_mode: string;
  transaction_ref?: string;
  payment_date: string;
  status: 'completed' | 'cancelled';
  allocations: FeePaymentAllocation[];
  remarks?: string;
  collected_by?: { first_name?: string; last_name?: string };
  student_id?: {
    admission_no?: string;
    class_id?: { name?: string };
    section_id?: { name?: string };
    user_id?: { first_name?: string; last_name?: string };
  };
}

export const feeService = {
  getMyFee: async (): Promise<{ studentFees: StudentFeeRecord[] }> => {
    const res = await API.get('/fees/my');
    return res.data;
  },

  getMyPayments: async (): Promise<{ payments: FeePayment[] }> => {
    const res = await API.get('/fees/payments/mine');
    return res.data;
  },

  getPayment: async (id: string): Promise<{ payment: FeePayment }> => {
    const res = await API.get(`/fees/payments/${id}`);
    return res.data;
  },
};
