import { ClientModal, CaseModal, SessionModal, DocumentModal, EmployeeModal, ArchiveCaseModal } from '../Modals';
import { ClientReportModal } from '../ClientReportModal';
import { InvitationLinkModal } from '../InvitationLinkModal';
import { PaymentReminderModal } from '../PaymentReminderModal';
import type { CaseRecord, Client, Employee, Invitation, Lawyer, SessionItem } from '../../types/app';
import type { initialCaseForm, initialClientForm, initialEmployeeForm, initialSessionForm } from '../../app/workspaceForms';

interface WorkspaceModalsProps {
  showClientModal: boolean;
  editingClient: Client | null;
  newClient: typeof initialClientForm;
  onClientChange: (form: typeof initialClientForm) => void;
  onSaveClient: () => void;
  onCloseClient: () => void;
  showCaseModal: boolean;
  editingCase: CaseRecord | null;
  newCase: typeof initialCaseForm;
  clients: Client[];
  lawyers: Lawyer[];
  onCaseChange: (form: typeof initialCaseForm) => void;
  onSaveCase: () => void;
  onCloseCase: () => void;
  showSessionModal: boolean;
  editingSession: SessionItem | null;
  newSession: typeof initialSessionForm;
  cases: CaseRecord[];
  onSessionChange: (form: typeof initialSessionForm) => void;
  onSaveSession: () => void;
  onCloseSession: () => void;
  showDocumentModal: boolean;
  newDocument: { title: string; caseId: string; category: string };
  onDocumentChange: (form: { title: string; caseId: string; category: string }) => void;
  onSaveDocument: () => void;
  onCloseDocument: () => void;
  documentFile: File | null;
  onFileSelect: (file: File | null) => void;
  showEmployeeModal: boolean;
  editingEmployee: Employee | null;
  newEmployee: typeof initialEmployeeForm;
  onEmployeeChange: (form: typeof initialEmployeeForm) => void;
  onSaveEmployee: () => void;
  onCloseEmployee: () => void;
  showArchiveModal: boolean;
  archivingCase: CaseRecord | null;
  archiveNotes: string;
  onArchiveNotesChange: (notes: string) => void;
  onConfirmArchive: () => void;
  onCloseArchive: () => void;
  reportClient: Client | null;
  whatsappReportsEnabled: boolean;
  smsReportsEnabled: boolean;
  onCloseReport: () => void;
  onReportSent: (message: string) => void;
  pendingInvitationShare: Invitation | null;
  firmName?: string;
  onCloseInvitation: () => void;
  onInvitationCopied: (message: string) => void;
  paymentReminderCase: CaseRecord | null;
  paymentReminderClient: Client | null;
  officeName: string;
  onClosePaymentReminder: () => void;
  onPaymentReminderSent: (message: string, type?: import('../../types/app').AlertState['type']) => void;
}

export function WorkspaceModals(props: WorkspaceModalsProps) {
  const {
    showClientModal,
    editingClient,
    newClient,
    onClientChange,
    onSaveClient,
    onCloseClient,
    showCaseModal,
    editingCase,
    newCase,
    clients,
    lawyers,
    onCaseChange,
    onSaveCase,
    onCloseCase,
    showSessionModal,
    editingSession,
    newSession,
    cases,
    onSessionChange,
    onSaveSession,
    onCloseSession,
    showDocumentModal,
    newDocument,
    onDocumentChange,
    onSaveDocument,
    onCloseDocument,
    documentFile,
    onFileSelect,
    showEmployeeModal,
    editingEmployee,
    newEmployee,
    onEmployeeChange,
    onSaveEmployee,
    onCloseEmployee,
    showArchiveModal,
    archivingCase,
    archiveNotes,
    onArchiveNotesChange,
    onConfirmArchive,
    onCloseArchive,
    reportClient,
    whatsappReportsEnabled,
    smsReportsEnabled,
    onCloseReport,
    onReportSent,
    pendingInvitationShare,
    firmName,
    onCloseInvitation,
    onInvitationCopied,
    paymentReminderCase,
    paymentReminderClient,
    officeName,
    onClosePaymentReminder,
    onPaymentReminderSent
  } = props;

  return (
    <>
      <ClientModal
        open={showClientModal}
        client={editingClient}
        formState={newClient}
        onChange={onClientChange}
        onSave={onSaveClient}
        onClose={onCloseClient}
      />
      <CaseModal
        open={showCaseModal}
        caseRecord={editingCase}
        formState={newCase}
        clients={clients}
        lawyers={lawyers}
        onChange={onCaseChange}
        onSave={onSaveCase}
        onClose={onCloseCase}
      />
      <SessionModal
        open={showSessionModal}
        session={editingSession}
        formState={newSession}
        cases={cases}
        onChange={onSessionChange}
        onSave={onSaveSession}
        onClose={onCloseSession}
      />
      <DocumentModal
        open={showDocumentModal}
        formState={newDocument}
        cases={cases}
        onChange={onDocumentChange}
        onSave={onSaveDocument}
        onClose={onCloseDocument}
        onFileSelect={onFileSelect}
        selectedFile={documentFile}
      />
      <EmployeeModal
        open={showEmployeeModal}
        employee={editingEmployee}
        formState={newEmployee}
        onChange={onEmployeeChange}
        onSave={onSaveEmployee}
        onClose={onCloseEmployee}
      />
      <ArchiveCaseModal
        open={showArchiveModal}
        caseRecord={archivingCase}
        notes={archiveNotes}
        onNotesChange={onArchiveNotesChange}
        onConfirm={onConfirmArchive}
        onClose={onCloseArchive}
      />
      <ClientReportModal
        client={reportClient}
        open={Boolean(reportClient)}
        whatsappEnabled={whatsappReportsEnabled}
        smsEnabled={smsReportsEnabled}
        onClose={onCloseReport}
        onSent={onReportSent}
      />
      <InvitationLinkModal
        open={Boolean(pendingInvitationShare)}
        invitation={pendingInvitationShare}
        firmName={firmName}
        onClose={onCloseInvitation}
        onCopied={onInvitationCopied}
      />
      <PaymentReminderModal
        open={Boolean(paymentReminderCase)}
        caseRecord={paymentReminderCase}
        client={paymentReminderClient}
        officeName={officeName}
        whatsappEnabled={whatsappReportsEnabled}
        smsEnabled={smsReportsEnabled}
        onClose={onClosePaymentReminder}
        onSent={onPaymentReminderSent}
      />
    </>
  );
}
