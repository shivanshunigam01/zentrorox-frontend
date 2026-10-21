import { Routes, Route, Navigate, useParams } from 'react-router-dom'
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
import { WipManagementPage } from '@/pages/app/wip-management-page'
import { QcManagementPage } from '@/pages/app/qc-management-page'
import { StageQueuePage } from '@/pages/app/stage-queue-page'
import {
  JobCardsLivePage, PartsMasterLivePage, PartsStockLivePage, PartsDashboardLivePage,
  PurchaseRequisitionLivePage, OutstandingLivePage,
  AdminLivePage, SettingsLivePage, BillingReceiptsLivePage,
  GenericPartsModulePage, GenericPurchaseModulePage,
} from '@/pages/app/module-live-pages'
import { ReportsPage } from '@/pages/app/reports-page'
import { PickupOperationsPage } from '@/pages/app/pickup-operations-page'
import { VehicleReceivingWorkspacePage } from '@/pages/app/vehicle-receiving-workspace-page'
import { ServiceVisitReceivingWorkspacePage } from '@/pages/app/service-visit-receiving-workspace-page'
import { TrialInspectionDashboardPage } from '@/pages/app/trial-inspection-dashboard-page'
import { TrialInspectionWorkspacePage } from '@/pages/app/trial-inspection-workspace-page'
import { EstimateManagementPage } from '@/pages/app/estimate-management-page'
import { ApprovalManagementPage } from '@/pages/app/approval-management-page'
import { JobCardManagementPage } from '@/pages/app/job-card-management-page'
import { BillingDeliveryPage } from '@/pages/app/billing-delivery-page'

function LegacyInspectionCaseRedirect() {
  const { caseId } = useParams<{ caseId: string }>()
  return <Navigate to={`/app/workshop/inspection/${caseId ?? ''}`} replace />
}

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

        <Route path="service-visits/:visitId/receiving" element={<ServiceVisitReceivingWorkspacePage />} />
        <Route path="service-visits/:visitId/:stage" element={<ServiceVisitPage />} />

        <Route path="workshop/bookings" element={<BookingsPage />} />
        <Route path="workshop/booking-pickup" element={<BookingsPage />} />
        <Route path="workshop/pickup" element={<PickupOperationsPage />} />
        <Route path="workshop/receiving-hub" element={<VehicleReceivingWorkspacePage />} />
        <Route path="workshop/gate-in" element={<StageQueuePage stage="ARRIVAL" title="Gate-In" description="Vehicles awaiting gate entry" />} />
        <Route path="workshop/receiving" element={<StageQueuePage stage="INVENTORY" title="Vehicle Receiving" description="Vehicles in receiving inventory stage" />} />
        <Route path="workshop/inspection" element={<TrialInspectionDashboardPage />} />
        <Route path="workshop/inspection/:caseId" element={<TrialInspectionWorkspacePage />} />
        <Route path="workshop/trial-inspection" element={<Navigate to="/app/workshop/inspection" replace />} />
        <Route path="workshop/trial-inspection/:caseId" element={<LegacyInspectionCaseRedirect />} />
        <Route path="workshop/voc" element={<Navigate to="/app/workshop/inspection" replace />} />
        <Route path="workshop/diagnosis" element={<Navigate to="/app/workshop/inspection" replace />} />
        <Route path="workshop/estimates" element={<EstimateManagementPage />} />
        <Route path="workshop/estimates/:estimateId" element={<EstimateManagementPage />} />
        <Route path="workshop/approvals" element={<ApprovalManagementPage />} />
        <Route path="workshop/approvals/:visitId" element={<ApprovalManagementPage />} />
        <Route path="workshop/job-cards" element={<JobCardManagementPage />} />
        <Route path="workshop/job-cards/:jobCardId" element={<JobCardManagementPage />} />
        <Route path="workshop/job-cards-legacy" element={<JobCardsLivePage />} />
        <Route path="workshop/floor" element={<Navigate to="/app/workshop/wip?view=floor" replace />} />
        <Route path="workshop/bay-board" element={<Navigate to="/app/workshop/wip?view=bay" replace />} />
        <Route path="workshop/technician-board" element={<Navigate to="/app/workshop/wip?view=technician" replace />} />
        <Route path="workshop/wip" element={<WipManagementPage />} />
        <Route path="workshop/wip/:jobCardId" element={<WipManagementPage />} />
        <Route path="workshop/qc" element={<QcManagementPage />} />
        <Route path="workshop/qc/:qcCaseId" element={<QcManagementPage />} />
        <Route path="workshop/road-test" element={<Navigate to="/app/workshop/qc" replace />} />
        <Route path="workshop/quality-check" element={<Navigate to="/app/workshop/qc" replace />} />
        <Route path="workshop/quantity-check" element={<Navigate to="/app/workshop/qc" replace />} />
        <Route path="workshop/quantity-verification" element={<Navigate to="/app/workshop/qc" replace />} />
        <Route path="workshop/billing-delivery" element={<BillingDeliveryPage />} />
        <Route path="workshop/billing-delivery/:visitId" element={<BillingDeliveryPage />} />
        <Route path="workshop/delivery" element={<Navigate to="/app/workshop/billing-delivery" replace />} />

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

        <Route path="billing/invoice" element={<Navigate to="/app/workshop/billing-delivery" replace />} />
        <Route path="billing/receipts" element={<BillingReceiptsLivePage />} />
        <Route path="billing/credit-notes" element={<OutstandingLivePage />} />
        <Route path="billing/outstanding" element={<OutstandingLivePage />} />
        <Route path="billing/gatepass" element={<Navigate to="/app/workshop/billing-delivery" replace />} />

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
