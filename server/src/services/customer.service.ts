import crypto from "crypto";
import {
  createCustomer,
  deleteCustomerById,
  findCustomerById,
  findCustomers,
  updateCustomerById,
} from "../models/customer.model.js";
import {
  createFollowUp,
  findFollowUpsByCustomerId,
} from "../models/followup.model.js";
import {
  CreateCustomerInput,
  CreateFollowUpInput,
  CustomerQueryInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema.js";

const emptyToNull = (
  value: string | null | undefined
): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
};

export const listCustomers = async (query: CustomerQueryInput) => {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;

  const { customers, total } = await findCustomers({
    search: query.search,
    status: query.status,
    customerType: query.customerType,
    limit,
    offset,
  });

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

export const getCustomerById = async (id: string) => {
  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};

export const createNewCustomer = async (input: CreateCustomerInput) => {
  const id = crypto.randomUUID();

  await createCustomer({
    id,
    name: input.name,
    mobile: input.mobile,
    email: emptyToNull(input.email),
    businessName: emptyToNull(input.businessName),
    gstNumber: emptyToNull(input.gstNumber),
    customerType: input.customerType,
    address: emptyToNull(input.address),
    status: input.status || "LEAD",
    followUpDate: emptyToNull(input.followUpDate),
    notes: emptyToNull(input.notes),
  });

  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Failed to create customer");
  }

  return customer;
};

export const updateCustomer = async (
  id: string,
  input: UpdateCustomerInput
) => {
  const existing = await findCustomerById(id);

  if (!existing) {
    throw new Error("Customer not found");
  }

  const payload: Parameters<typeof updateCustomerById>[1] = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.mobile !== undefined) payload.mobile = input.mobile;
  if (input.email !== undefined) payload.email = emptyToNull(input.email);
  if (input.businessName !== undefined) {
    payload.businessName = emptyToNull(input.businessName);
  }
  if (input.gstNumber !== undefined) {
    payload.gstNumber = emptyToNull(input.gstNumber);
  }
  if (input.customerType !== undefined) {
    payload.customerType = input.customerType;
  }
  if (input.address !== undefined) {
    payload.address = emptyToNull(input.address);
  }
  if (input.status !== undefined) payload.status = input.status;
  if (input.followUpDate !== undefined) {
    payload.followUpDate = emptyToNull(input.followUpDate);
  }
  if (input.notes !== undefined) payload.notes = emptyToNull(input.notes);

  if (Object.keys(payload).length === 0) {
    return existing;
  }

  await updateCustomerById(id, payload);

  const customer = await findCustomerById(id);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};

export const removeCustomer = async (id: string) => {
  const existing = await findCustomerById(id);

  if (!existing) {
    throw new Error("Customer not found");
  }

  await deleteCustomerById(id);

  return { id };
};

export const listCustomerFollowUps = async (customerId: string) => {
  const customer = await findCustomerById(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return findFollowUpsByCustomerId(customerId);
};

export const addCustomerFollowUp = async (
  customerId: string,
  userId: string,
  input: CreateFollowUpInput
) => {
  const customer = await findCustomerById(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const id = crypto.randomUUID();
  const followUpDate = emptyToNull(input.followUpDate);

  await createFollowUp({
    id,
    customerId,
    note: input.note,
    followUpDate,
    createdBy: userId,
  });

  if (followUpDate) {
    await updateCustomerById(customerId, { followUpDate });
  }

  const followUps = await findFollowUpsByCustomerId(customerId);
  const created = followUps.find((item) => item.id === id);

  if (!created) {
    throw new Error("Failed to create follow-up");
  }

  return created;
};
