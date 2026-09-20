import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/public-layout'
import { AppShell } from '@/components/layout/app-shell'
import { RequireAuth } from '@/components/auth/require-auth'
import { LandingPage } from '@/pages/public/landing-page'
import { LoginPage } from '@/pages/auth/login-page'
import { DashboardPage } from '@/pages/app/dashboard-page'
import { CustomersPage } from '@/pages/app/customers-page'
import { CustomerDetailPage } from '@/pages/app/customer-detail-page'
import { VehiclesPage } from '@/pages/app/vehicles-page'
import { BookingsPage } from '@/pages/app/bookings-page'
import { MastersPage } from '@/pages/app/masters-page'
import { ServiceVisitPage } from '@/pages/app/service-visit-page'
import { WipPage } from '@/pages/app/wip-page'
import { StageQueuePage } from '@/pages/app/stage-queue-page'
import {
  JobCardsLivePage, PartsMasterLivePage, PartsStockLivePage, PartsDashboardLivePage,
  BayBoardLivePage, TechnicianBoardLivePage, WorkshopFloorLivePage,
  PurchaseRequisitionLivePage, OutstandingLivePage,
  AdminLivePage, SettingsLivePage, BillingInvoicesLivePage, BillingReceiptsLivePage,
  GenericPartsModulePage, GenericPurchaseModulePage,
} from '@/pages/app/module-live-pages'
import { ReportsPage } from '@/pages/app/reports-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="service-visits/:visitId/:stage" element={<ServiceVisitPage />} />

        <Route path="workshop/bookings" element={<BookingsPage />} />
        <Route path="workshop/pickup" element={<StageQueuePage stage="PICKUP" title="Pickup" description="Vehicles scheduled for pickup — live from service visits" />} />
        <Route path="workshop/gate-in" element={<StageQueuePage stage="ARRIVAL" title="Gate-In" description="Vehicles awaiting gate entry" />} />
        <Route path="workshop/receiving" element={<StageQueuePage stage="INVENTORY" title="Vehicle Receiving" description="Vehicles in receiving inventory stage" />} />
        <Route path="workshop/voc" element={<StageQueuePage stage="VOC" title="Voice of Customer" description="Vehicles awaiting VOC capture" />} />
        <Route path="workshop/inspection" element={<StageQueuePage stage="INSPECTION" title="Inspection" description="Vehicles in inspection stage" />} />
        <Route path="workshop/diagnosis" element={<StageQueuePage stage="DIAGNOSIS" title="Diagnosis" description="Vehicles in diagnosis stage" />} />
        <Route path="workshop/estimates" element={<StageQueuePage stage="ESTIMATE" title="Estimates" description="Vehicles awaiting estimate" />} />
        <Route path="workshop/approvals" element={<StageQueuePage stage="APPROVAL" title="Approvals" description="Estimates pending customer approval" />} />
        <Route path="workshop/job-cards" element={<JobCardsLivePage />} />
        <Route path="workshop/floor" element={<WorkshopFloorLivePage />} />
        <Route path="workshop/bay-board" element={<BayBoardLivePage />} />
        <Route path="workshop/technician-board" element={<TechnicianBoardLivePage />} />
        <Route path="workshop/wip" element={<WipPage />} />
        <Route path="workshop/qc" element={<StageQueuePage stage="QC" title="Quality Check" description="Vehicles in QC stage" />} />
        <Route path="workshop/road-test" element={<StageQueuePage stage="ROAD_TEST" title="Road Test" description="Vehicles in road test stage" />} />
        <Route path="workshop/delivery" element={<StageQueuePage stage="DELIVERY" title="Delivery" description="Vehicles ready for delivery" />} />

        <Route path="parts/dashboard" element={<PartsDashboardLivePage />} />
        <Route path="parts/master" element={<PartsMasterLivePage />} />
        <Route path="parts/stock" element={<PartsStockLivePage />} />
        <Route path="parts/requisition" element={<GenericPartsModulePage title="Material Requisition" description="Parts stock available for requisition" />} />
        <Route path="parts/issue" element={<GenericPartsModulePage title="Material Issue" description="Parts inventory for issue to floor" />} />
        <Route path="parts/return" element={<GenericPartsModulePage title="Material Return" description="Returnable parts from stock" />} />
        <Route path="parts/otc-sales" element={<GenericPartsModulePage title="OTC Sales" description="Over-the-counter parts sales from stock" />} />
        <Route path="parts/stock-transfer" element={<PartsStockLivePage />} />
        <Route path="parts/stock-adjustment" element={<PartsStockLivePage />} />
        <Route path="parts/physical-verification" element={<PartsStockLivePage />} />

        <Route path="purchase/requisition" element={<PurchaseRequisitionLivePage />} />
        <Route path="purchase/rfq" element={<GenericPurchaseModulePage title="RFQ" description="Request for quotation based on low stock" />} />
        <Route path="purchase/purchase-order" element={<GenericPurchaseModulePage title="Purchase Orders" description="Pending purchase items from inventory alerts" />} />
        <Route path="purchase/grn" element={<PartsStockLivePage />} />
        <Route path="purchase/return" element={<GenericPurchaseModulePage title="Purchase Return" description="Return tracking linked to parts master" />} />
        <Route path="purchase/vendors" element={<PartsMasterLivePage />} />

        <Route path="billing/invoice" element={<BillingInvoicesLivePage />} />
        <Route path="billing/receipts" element={<BillingReceiptsLivePage />} />
        <Route path="billing/credit-notes" element={<OutstandingLivePage />} />
        <Route path="billing/outstanding" element={<OutstandingLivePage />} />
        <Route path="billing/gatepass" element={<StageQueuePage stage="GATEPASS" title="Gatepass" description="Vehicles awaiting gatepass authorization" />} />

        <Route path="crm/customers" element={<CustomersPage />} />
        <Route path="crm/customers/:id" element={<CustomerDetailPage />} />
        <Route path="crm/vehicles" element={<VehiclesPage />} />
        <Route path="crm/leads" element={<CustomersPage />} />
        <Route path="crm/follow-ups" element={<StageQueuePage stage="PSF" title="Follow-ups" description="Post-service follow-up queue" />} />
        <Route path="crm/feedback" element={<StageQueuePage stage="FEEDBACK" title="Feedback" description="Customer feedback pending closure" />} />
        <Route path="crm/psf" element={<StageQueuePage stage="PSF" title="PSF" description="Post-service follow-up activities" />} />
        <Route path="crm/complaints" element={<StageQueuePage stage="VOC" title="Complaints" description="Open VOC / complaint queue" />} />
        <Route path="crm/service-reminders" element={<CustomersPage />} />

        <Route path="reports" element={<ReportsPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="administration" element={<AdminLivePage />} />
        <Route path="settings" element={<SettingsLivePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
