import { createContext, useContext } from "react";
import { useMyGrantorPipeline } from "../../hooks/useMyGrantorPipeline";
import { useMyOrders } from "../../hooks/useMyOrders";

const EMPTY_CONTEXT = Object.freeze({
  source: "no-expedient",
  role: "admin",
  expedient: null,
  order: null,
  selectedId: null,
  options: [],
  selectExpedient: () => {},
  isDemo: false,
  loading: false,
});

const NuxeraExpedientContext = createContext(EMPTY_CONTEXT);

function ApplicantExpedientProvider({ children }) {
  const { orders, selectedOrder, orderId, selectOrder, isDemo, loading } = useMyOrders();
  const value = {
    source: isDemo ? "demo-isolated" : selectedOrder ? "applicant-order" : "no-expedient",
    role: "applicant",
    expedient: selectedOrder,
    order: selectedOrder,
    selectedId: orderId,
    options: orders.map((order) => ({ id: order.id, label: order.project_name || order.case_number || order.id })),
    selectExpedient: selectOrder,
    isDemo,
    loading,
  };
  return <NuxeraExpedientContext.Provider value={value}>{children}</NuxeraExpedientContext.Provider>;
}

function GrantorExpedientProvider({ children }) {
  const { pipeline, selectedEntry, authorizedOrder, orderId, selectOrder, isDemo, loading } = useMyGrantorPipeline();
  const value = {
    source: isDemo ? "demo-isolated" : selectedEntry ? "authorized-grantor-entry" : "no-expedient",
    role: "grantor",
    expedient: selectedEntry,
    order: authorizedOrder,
    selectedId: orderId,
    options: pipeline.map((entry) => ({ id: entry.order.id, label: entry.order.project_name || entry.order.case_number || entry.order.id })),
    selectExpedient: selectOrder,
    isDemo,
    loading,
  };
  return <NuxeraExpedientContext.Provider value={value}>{children}</NuxeraExpedientContext.Provider>;
}

export function NuxeraExpedientProvider({ role, children }) {
  if (role === "applicant") return <ApplicantExpedientProvider>{children}</ApplicantExpedientProvider>;
  if (role === "grantor") return <GrantorExpedientProvider>{children}</GrantorExpedientProvider>;
  return <NuxeraExpedientContext.Provider value={{ ...EMPTY_CONTEXT, role }}>{children}</NuxeraExpedientContext.Provider>;
}

export function useNuxeraExpedient() {
  return useContext(NuxeraExpedientContext);
}
