import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, Users, Briefcase, Calendar, FileText, Bell, CreditCard, Shield, 
  Settings, LogOut, Search, Plus, Trash2, Edit3, Eye, FileSpreadsheet, 
  TrendingUp, Clock, MapPin, ChevronLeft, ChevronRight, Menu, X, 
  HelpCircle, CheckCircle, AlertTriangle, Filter, Download, ArrowRight,
  Info, Award, ShieldAlert, BarChart3, User, BookOpen, Key, DollarSign,
  Check, UserCheck, FolderPlus, MessageSquare, AlertCircle, Lock, ShieldCheck
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AddClientForm from './components/AddClientForm';
import AddCaseForm from './components/AddCaseForm';
import { Client, CaseRecord } from './types/app';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'الباقة التجريبية',
    price: '0',
    period: 'شهرياً',
    features: ['إدارة حتى 5 قضايا', 'إدارة حتى 10 عملاء', 'مساحة تخزين 1 جيجابايت', 'دعم فني عبر البريد'],
    color: 'border-slate-300'
  },
  {
    id: 'pro',
    name: 'باقة المحامي المحترف',
    price: '45,000',
    period: 'شهرياً',
    features: ['عدد قضايا غير محدود', 'عدد عملاء غير محدود', 'مساحة تخزين 20 جيجابايت', 'مزامنة مع التقويم والرسائل القصيرة', 'دعم فني وتحديثات مستمرة', 'صياغة ذكية للعرائض'],
    color: 'border-amber-500 shadow-md ring-2 ring-amber-500/20',
    badge: 'الأكثر طلباً في اليمن'
  },
  {
    id: 'firm',
    name: 'باقة الشركات والمكاتب والشركاء',
    price: '120,000',
    period: 'شهرياً',
    features: ['كل ميزات الباقة المحترفة', 'إدارة حتى 10 محامين بالشركة', 'مساحة تخزين 100 جيجابايت', 'صلاحيات مخصصة وتوزيع مهام تلقائي', 'تقارير الأداء المالي والعملي المتقدمة', 'خط ساخن مخصص للدعم الفني'],
    color: 'border-indigo-800'
  }
];

const INITIAL_NOTIFICATIONS = [
  { id: '1', title: 'جلسة قادمة غداً', message: 'تذكير: لديك جلسة غداً في قضية "نزاع تجاري حول علامة تجارية" في محكمة استئناف الأمانة.', time: 'منذ ساعتين', read: false, type: 'session' },
  { id: '2', title: 'إضافة وثيقة جديدة', message: 'قام المحامي هلال يحيى بتحميل "عقد الإيجار الأصلي الموثق" لقضية علي العبسي.', time: 'منذ 5 ساعات', read: false, type: 'document' },
  { id: '3', title: 'تحديث في حالة القضية', message: 'تغيرت حالة القضية الخاصة بمؤسسة يمن سوفت إلى "تحت الدراسة".', time: 'منذ يوم واحد', read: true, type: 'case' }
];

const MONTHLY_CHART_DATA = [
  { month: 'يناير', cases: 8, resolved: 5, revenue: 320000 },
  { month: 'فبراير', cases: 12, resolved: 8, revenue: 450000 },
  { month: 'مارس', cases: 15, resolved: 10, revenue: 580000 },
  { month: 'أبريل', cases: 10, resolved: 12, revenue: 410000 },
  { month: 'مايو', cases: 18, resolved: 14, revenue: 720000 },
  { month: 'يونيو', cases: 22, resolved: 15, revenue: 890000 }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'forgot' | 'dashboard' | 'clients' | 'cases' | 'sessions' | 'documents' | 'lawyers' | 'subscription' | 'profile' | 'settings' | 'reports' | 'help' | 'notifications'>('landing');
  
  const [user, setUser] = useState<{ name: string; email: string; role: string; plan: string; company: string; phone: string; licenseNo?: string; image?: string } | null>(null);
  const [role, setRole] = useState<string>('firm_manager');
  
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [activeChartTab, setActiveChartTab] = useState<'cases' | 'revenue'>('cases');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // جلب البيانات من Supabase عند تحميل المكون
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsData, casesData, sessionsData, documentsData, lawyersData] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('cases').select('*'),
          supabase.from('sessions').select('*'),
          supabase.from('documents').select('*'),
          supabase.from('lawyers').select('*')
        ]);

        if (!clientsData.error) setClients(clientsData.data || []);
        if (!casesData.error) setCases(casesData.data || []);
        if (!sessionsData.error) setSessions(sessionsData.data || []);
        if (!documentsData.error) setDocuments(documentsData.data || []);
        if (!lawyersData.error) setLawyers(lawyersData.data || []);

        setLoading(false);
      } catch (error) {
        console.error('خطأ في جلب البيانات من Supabase:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [categoryFilter, setCategoryFilter] = useState('الكل');

  // حالات النماذج الجديدة
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);

  // حالات النماذج القديمة (للتوافقية)
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '', type: 'فرد' });

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [newCase, setNewCase] = useState({ title: '', clientId: '', category: 'تجاري', status: 'نشط', court: '', caseNo: '', lawyerId: '', description: '' });

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [newSession, setNewSession] = useState({ caseId: '', court: '', date: '', time: '', status: 'مجدولة', type: '', notes: '' });

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', caseId: '', category: 'مستند قانوني' });

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const checkAccess = (allowedRoles: string[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const handleLogin = (email: string, pass: string) => {
    if (!email || !pass) {
      showAlert('يرجى ملء جميع حقول الدخول السرية.', 'error');
      return;
    }
    setUser({
      name: 'الأستاذ الدكتور نجيب الشراعي',
      email: email,
      role: role,
      plan: 'pro',
      company: 'مجموعة اليماني للمحاماة والاستشارات',
      phone: '+967 770 123 456',
      licenseNo: 'م ع/١١٢/٢٠٢٣'
    });
    setCurrentPage('dashboard');
    showAlert('تم التحقق وتسجيل الدخول للمنصة بنجاح.', 'success');
  };

  const handleRegister = (name: string, email: string, company: string) => {
    if (!name || !email || !company) {
      showAlert('يرجى ملء جميع الحقول المطلوبة لإنشاء المكتب.', 'error');
      return;
    }
    setUser({
      name: name,
      email: email,
      role: 'firm_manager',
      plan: 'free',
      company: company,
      phone: '+967 770 000 000',
      licenseNo: 'لم يقدم بعد'
    });
    setCurrentPage('dashboard');
    showAlert('تم تهيئة مكتبك الجديد بنجاح على الخطة التجريبية.', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    showAlert('تم إنهاء الجلسة وتسجيل الخروج بأمان.', 'info');
  };

  // دالة معالجة إضافة عميل جديد من النموذج
  const handleAddClient = (newClient: Client) => {
    setClients(prevClients => [newClient, ...prevClients]);
  };

  // دالة معالجة إضافة قضية جديدة من النموذج
  const handleAddCase = (newCase: CaseRecord) => {
    setCases(prevCases => [newCase, ...prevCases]);
    // تحديث عدد القضايا للعميل المرتبط
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === newCase.clientId
          ? { ...client, casesCount: client.casesCount + 1 }
          : client
      )
    );
  };

  const saveClient = () => {
    const phoneRegex = /^(77|73|71|70)\d{7}$/;
    if (!newClient.name.trim()) {
      showAlert('اسم الموكل مطلوب لتسجيله في الأرشيف!', 'error');
      return;
    }
    if (!newClient.phone.match(phoneRegex)) {
      showAlert('يرجى إدخال رقم هاتف يمني صحيح مكون من 9 أرقام (مثال: 771234567)', 'error');
      return;
    }

    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...newClient } : c));
      showAlert('تم تحديث ملف العميل والاتصال بأمان.');
    } else {
      const added = { 
        ...newClient, 
        id: String(clients.length + 1), 
        casesCount: 0, 
        createdAt: new Date().toISOString().split('T')[0] 
      };
      setClients([added, ...clients]);
      showAlert('تم ترحيل وحفظ بيانات الموكل لقاعدة البيانات.');
    }
    setShowClientModal(false);
    setEditingClient(null);
    setNewClient({ name: '', phone: '', email: '', address: '', type: 'فرد' });
  };

  const deleteClient = (id: string) => {
    if (!checkAccess(['admin', 'firm_manager'])) {
      showAlert('ليس لديك صلاحية حذف عملاء من النظام.', 'error');
      return;
    }
    const hasCases = cases.some(c => c.clientId === id);
    if (hasCases) {
      showAlert('لا يمكن حذف الموكل لارتباطه بقضايا نشطة مسجلة في المحاكم!', 'error');
      return;
    }
    setClients(clients.filter(c => c.id !== id));
    showAlert('تم إزالة العميل بنجاح.', 'info');
  };

  const saveCase = () => {
    if (!newCase.title.trim() || !newCase.clientId || !newCase.caseNo.trim() || !newCase.court.trim()) {
      showAlert('يرجى تعبئة كافة حقول القضية والمحكمة والرقم القضائي!', 'error');
      return;
    }
    const targetClient = clients.find(c => c.id === newCase.clientId);
    const clientName = targetClient ? targetClient.name : 'غير محدد';
    
    if (editingCase) {
      setCases(cases.map(c => c.id === editingCase.id ? { ...c, ...newCase, clientName } : c));
      showAlert('تم تعديل وحفظ المذكرة القضائية بنجاح.');
    } else {
      const added = { 
        ...newCase, 
        id: String(cases.length + 1), 
        clientName, 
        dateStarted: new Date().toISOString().split('T')[0] 
      };
      setCases([added, ...cases]);
      setClients(clients.map(c => c.id === newCase.clientId ? { ...c, casesCount: c.casesCount + 1 } : c));
      showAlert('تم فتح وأرشفة ملف القضية الجديد.');
    }
    setShowCaseModal(false);
    setEditingCase(null);
    setNewCase({ title: '', clientId: '', category: 'تجاري', status: 'نشط', court: '', caseNo: '', lawyerId: '', description: '' });
  };

  const deleteCase = (id: string) => {
    if (!checkAccess(['admin', 'firm_manager'])) {
      showAlert('عذراً، تقتصر صلاحية الحذف على مدراء المكاتب فقط.', 'error');
      return;
    }
    setCases(cases.filter(c => c.id !== id));
    showAlert('تم حذف ملف القضية بالكامل.', 'info');
  };

  const saveSession = () => {
    if (!newSession.caseId || !newSession.date || !newSession.time || !newSession.court.trim() || !newSession.type.trim()) {
      showAlert('يرجى إكمال تفاصيل وتوقيت ومحكمة الجلسة المجدولة!', 'error');
      return;
    }
    const targetCase = cases.find(c => c.id === newSession.caseId);
    const caseTitle = targetCase ? targetCase.title : 'قضية مجهولة';

    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...s, ...newSession, caseTitle } : s));
      showAlert('تم حفظ تحديثات موعد الجلسة.');
    } else {
      const added = { ...newSession, id: String(sessions.length + 1), caseTitle };
      setSessions([added, ...sessions]);
      
      const newNotif = {
        id: String(notifications.length + 1),
        title: 'موعد جلسة جديدة',
        message: `مجدولة لقضية "${caseTitle}" بتاريخ ${newSession.date} الساعة ${newSession.time}.`,
        time: 'الآن',
        read: false,
        type: 'session'
      };
      setNotifications([newNotif, ...notifications]);
      showAlert('تم حفظ الجلسة بالتقويم وإرسال التنبيه التلقائي للمحامي.');
    }
    setShowSessionModal(false);
    setEditingSession(null);
    setNewSession({ caseId: '', court: '', date: '', time: '', status: 'مجدولة', type: '', notes: '' });
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    showAlert('تم إلغاء وإزالة موعد الجلسة بنجاح.', 'info');
  };

  const uploadDocument = () => {
    if (!newDocument.title.trim() || !newDocument.caseId) {
      showAlert('يرجى تعيين اسم المستند وربطه بملف قضية قائم.', 'error');
      return;
    }
    const targetCase = cases.find(c => c.id === newDocument.caseId);
    const caseTitle = targetCase ? targetCase.title : 'قضية عامة';
    
    const addedDoc = {
      id: String(documents.length + 1),
      title: newDocument.title.endsWith('.pdf') || newDocument.title.endsWith('.docx') ? newDocument.title : `${newDocument.title}.pdf`,
      caseId: newDocument.caseId,
      caseTitle,
      category: newDocument.category,
      size: '1.2 MB',
      dateUploaded: new Date().toISOString().split('T')[0],
      url: '#'
    };
    
    setDocuments([addedDoc, ...documents]);
    setShowDocumentModal(false);
    setNewDocument({ title: '', caseId: '', category: 'مستند قانوني' });
    showAlert('تم تشفير ورفع المستند بنجاح لسحابة Supabase.');
  };

  const stats = useMemo(() => {
    return {
      totalClients: clients.length,
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'نشط' || c.status === 'جلسة قادمة').length,
      upcomingSessions: sessions.filter(s => s.status === 'مجدولة').length,
      totalDocuments: documents.length,
      lawyersCount: lawyers.length
    };
  }, [clients, cases, sessions, documents, lawyers]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.caseNo.includes(searchQuery);
      const matchStatus = statusFilter === 'الكل' || c.status === statusFilter;
      const matchCategory = categoryFilter === 'الكل' || c.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [cases, searchQuery, statusFilter, categoryFilter]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) || 
      c.type.includes(searchQuery)
    );
  }, [clients, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-500 selection:text-white" dir="rtl">
      
      {/* شاشة تحميل البيانات */}
      {loading && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="font-bold text-slate-900">جاري تحميل البيانات...</h3>
            <p className="text-xs text-slate-500">يتم استرجاع البيانات من خوادم Supabase الآمنة</p>
          </div>
        </div>
      )}
      
      {/* التنبيه العائم العلوي */}
      {alertMsg && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-slate-900 text-white py-3.5 px-6 rounded-xl shadow-2xl border-l-4 border-amber-500 transition-transform duration-300 transform translate-y-0">
          {alertMsg.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {alertMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
          {alertMsg.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          <span className="text-sm font-medium">{alertMsg.text}</span>
        </div>
      )}

      {/* الهيدر الرئيسي وتجربة المستخدم المتميزة */}
      {user && (
        <header className="sticky top-0 z-40 bg-indigo-950 text-white shadow-md border-b border-indigo-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
              <div className="bg-amber-500 p-2 rounded-lg text-indigo-950">
                <Scale className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block">LegalMind <span className="text-amber-400">Yemen</span></span>
                <span className="text-[10px] text-indigo-300 block -mt-1 font-mono">نظام إدارة مكاتب المحاماة اليمنية</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {[
                { id: 'dashboard', label: 'الرئيسية', icon: BarChart3 },
                { id: 'clients', label: 'العملاء', icon: Users },
                { id: 'cases', label: 'القضايا', icon: Briefcase },
                { id: 'sessions', label: 'الجلسات', icon: Calendar },
                { id: 'documents', label: 'المستندات', icon: FileText },
                { id: 'lawyers', label: 'المحامون', icon: Shield },
                { id: 'reports', label: 'التقارير المالية', icon: TrendingUp },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.id 
                      ? 'bg-amber-500 text-slate-900 shadow-sm font-bold' 
                      : 'hover:bg-indigo-900 text-slate-200'
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 bg-indigo-900 px-2.5 py-1 rounded-full text-xs text-indigo-200">
                <span className="font-semibold text-[10px] text-amber-400">صلاحية النظام الحالية:</span>
                <select 
                  value={role} 
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (user) setUser({ ...user, role: e.target.value });
                    showAlert(`تم تغيير مستوى الصلاحية إلى: ${e.target.value === 'admin' ? 'مدير نظام كامل' : e.target.value === 'firm_manager' ? 'مدير مكتب محاماة' : 'محامٍ ممارس'}`, 'info');
                  }}
                  className="bg-transparent text-indigo-200 outline-none cursor-pointer text-xs font-bold border-none"
                >
                  <option className="bg-indigo-950 text-white" value="admin">مدير نظام كامل</option>
                  <option className="bg-indigo-950 text-white" value="firm_manager">مدير مكتب شركاء</option>
                  <option className="bg-indigo-950 text-white" value="lawyer">محامٍ ممارس</option>
                  <option className="bg-indigo-950 text-white" value="consultant">مستشار خارجي</option>
                </select>
              </div>

              {/* زر الإشعارات */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-900 rounded-lg relative transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-indigo-950 animate-pulse"></span>
                  )}
                </button>

                {showNotificationDropdown && (
                  <div className="absolute left-0 mt-2 w-80 bg-white text-slate-900 rounded-xl shadow-xl py-2 z-50 border border-slate-100">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <span className="font-bold text-xs text-slate-700">تنبيهات النظام الذكية</span>
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                          showAlert('تم تحديد كل التنبيهات كمقروءة.');
                        }}
                        className="text-[11px] text-indigo-700 hover:underline font-bold"
                      >
                        تعيين الكل كمقروء
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-right cursor-pointer ${notif.read ? '' : 'bg-amber-50/40'}`}
                          onClick={() => {
                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            setCurrentPage('notifications');
                            setShowNotificationDropdown(false);
                          }}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-xs text-slate-800">{notif.title}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* حساب المستخدم المنسدل */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 hover:bg-indigo-900 rounded-lg transition-colors text-right"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-indigo-950 flex items-center justify-center font-bold text-xs border border-amber-300">
                    {user.name.substring(3, 5)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold leading-tight">{user.name}</p>
                    <p className="text-[9px] text-indigo-300 font-sans">مكتب معتمد</p>
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute left-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-xl py-2 z-50 border border-slate-100">
                    <div className="px-4 py-3 border-b border-slate-100 text-right bg-slate-50">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 break-all">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { setCurrentPage('profile'); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>الملف الشخصي والترخيص</span>
                    </button>
                    <button 
                      onClick={() => { setCurrentPage('subscription'); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>باقة الاشتراك والفوترة</span>
                    </button>
                    <button 
                      onClick={() => { setCurrentPage('settings'); setShowUserDropdown(false); }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>إعدادات المكتب</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-indigo-200 hover:text-white rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

            </div>
          </div>

          {/* القائمة المحمولة */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-indigo-900 border-t border-indigo-800 px-4 py-3 space-y-1">
              {[
                { id: 'dashboard', label: 'لوحة التحكم والتحليلات', icon: BarChart3 },
                { id: 'clients', label: 'العملاء وممثلي الشركات', icon: Users },
                { id: 'cases', label: 'ملفات القضايا والمرافعات', icon: Briefcase },
                { id: 'sessions', label: 'مواعيد وجدول الجلسات', icon: Calendar },
                { id: 'documents', label: 'خزانة المستندات والوثائق', icon: FileText },
                { id: 'lawyers', label: 'الفريق وصلاحيات الموظفين', icon: Shield },
                { id: 'reports', label: 'التقارير والمقاييس المالية', icon: TrendingUp },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    currentPage === item.id 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'text-indigo-100 hover:bg-indigo-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>
      )}

      {/* --- محتوى الصفحات الرئيسي --- */}
      <main className="pb-16">
        
        {/* ==================================== */}
        {/* 1. صفحة الهبوط والتسويق (Landing Page) */}
        {/* ==================================== */}
        {currentPage === 'landing' && (
          <div className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white min-h-screen">
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-xl text-indigo-950">
                  <Scale className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight">LegalMind <span className="text-amber-400">Yemen</span></span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentPage('login')} 
                  className="text-slate-200 hover:text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-800/40 transition-colors"
                >
                  دخول المحامين
                </button>
                <button 
                  onClick={() => setCurrentPage('register')} 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-lg hover:shadow-amber-500/15"
                >
                  اشترك الآن مجاناً
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center md:text-right grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                  <Award className="w-3.5 h-3.5" />
                  المنصة الرقمية الأولى للمحاماة في اليمن لعام 2026
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
                  أدر مكتب المحاماة الخاص بك <br />
                  <span className="text-amber-400 bg-clip-text">بذكاء وسرية مطلقة</span>
                </h1>
                <p className="text-base sm:text-lg text-indigo-200 max-w-2xl leading-relaxed">
                  نظام حوسبة قانوني متكامل يمني الطابع؛ يُنظم لك القضايا والعملاء، ويجدول الجلسات والمرافعات، ويحفظ المستندات بسحابة آمنة، لتتفرغ لتطبيق العدالة وصناعة الفارق.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-start">
                  <button 
                    onClick={() => setCurrentPage('register')} 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-4 rounded-xl text-base shadow-xl hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>ابدأ الفترة التجريبية لمكتبك</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentPage('login');
                    }}
                    className="border border-indigo-700 hover:bg-indigo-800 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors"
                  >
                    عرض الدخول التجريبي السريع
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl rotate-3 opacity-10 blur-xl"></div>
                <div className="relative bg-indigo-950/80 backdrop-blur-md border border-indigo-800 p-6 rounded-3xl shadow-2xl">
                  <div className="flex items-center justify-between border-b border-indigo-900 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono">لوحة تحكم القانوني - نسخة تجريبية</span>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-900/50 p-4 rounded-xl border border-indigo-800/40 text-right">
                      <div className="flex justify-between text-xs text-indigo-300 mb-1">
                        <span>إحصائيات القضايا المنظورة</span>
                        <span className="text-amber-400 font-bold">87% نسبة نجاح الأحكام</span>
                      </div>
                      <div className="w-full bg-indigo-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[87%] rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div className="bg-indigo-900/30 p-3 rounded-xl">
                        <span className="text-[11px] text-indigo-300 block">الجلسات القادمة اليوم</span>
                        <span className="text-xl font-black text-amber-400 font-sans">3 جلسات</span>
                      </div>
                      <div className="bg-indigo-900/30 p-3 rounded-xl">
                        <span className="text-[11px] text-indigo-300 block">العملاء النشطون بالمكتب</span>
                        <span className="text-xl font-black text-white font-sans">4 عملاء</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* قسم ميزات المنصة الـ 6 الرئيسية */}
            <div className="bg-slate-900 py-24 border-t border-indigo-950/40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                  <h2 className="text-3xl font-black">لماذا يعتمد المحامون اليمنيون على LegalMind؟</h2>
                  <p className="text-slate-400 text-sm">تم بناء منصتنا بالتشاور مع خبراء قانونيين وقضاة في اليمن لتطابق طبيعة المحاكمات والتوثيقات وإدارة مكاتب المحاماة بشكل مثالي.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
                  {[
                    { title: 'إدارة ملفات القضايا الرقمية', desc: 'تنظيم قضاياك وتاريخ المذكرات مع ربطها التلقائي بالعميل والمحامي الممارس وتحديث تفاصيل الحكم فور صدوره.', icon: Briefcase },
                    { title: 'أجندة الجلسات الذكية والتقويم', desc: 'نظام لتنبيهك بكل جلسة قادمة ومحكمة الانعقاد في عموم محافظات الجمهورية اليمنية مع رصد الملاحظات فوراً.', icon: Calendar },
                    { title: 'خزانة سوبابيس السحابية الآمنة', desc: 'امسح العرائض والمذكرات بهاتفك المحمول وارفعها بأمان تام. تشفير سحابي كامل للملفات والوصول إليها من أي مكان.', icon: FileText },
                    { title: 'صلاحيات الفريق والأدوار', desc: 'وزع الأدوار بين المحامي الشريك، المستشار، الموظف الإداري، والمحامي المتدرب لضمان سرية وحفظ الأسرار القانونية.', icon: Shield },
                    { title: 'تقارير الأداء المالي والعملي', desc: 'احصل على تحليل بياني للإيرادات والمدفوعات والاتعاب المتبقية لكل عميل وحساب كفاءة فريق العمل.', icon: TrendingUp },
                    { title: 'إشعارات لحظية عبر الواتساب والموقع', desc: 'لا تفوت جلسة أو موعد تقديم عريضة استئناف. تصلك التنبيهات دورياً لتظل دائماً في طليعة الموقف القانوني.', icon: Bell }
                  ].map((feat, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl hover:border-amber-500/30 transition-all hover:translate-y-[-4px]">
                      <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 mb-4">
                        <feat.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">{feat.title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 2. صفحة تسجيل الدخول (Login Page) */}
        {/* ==================================== */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto mt-20 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <div className="text-center mb-6">
                <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 mx-auto mb-3 shadow">
                  <Scale className="w-6 h-6 stroke-[2]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">تسجيل الدخول للمنصة</h2>
                <p className="text-xs text-slate-500 mt-1">الالتحاق بالنظام لإدارة مكاتب المحاماة في اليمن</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                handleLogin(data.get('email') as string, data.get('password') as string);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني المهني</label>
                  <input 
                    name="email" 
                    type="email" 
                    defaultValue="n.sharaee@legalmind.ye" 
                    placeholder="name@firm.com" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm text-right" 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">كلمة المرور السرية</label>
                    <button type="button" onClick={() => setCurrentPage('forgot')} className="text-[10px] text-indigo-700 hover:underline font-bold">نسيت كلمة المرور؟</button>
                  </div>
                  <input 
                    name="password" 
                    type="password" 
                    defaultValue="yemenLaw2026" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تحديد دورك الافتراضي للتجربة</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm bg-white"
                  >
                    <option value="firm_manager">مدير مكتب شركاء (كامل الصلاحيات المالية والعملية)</option>
                    <option value="lawyer">محامٍ ممارس (إدارة القضايا والعملاء الموكلين له)</option>
                    <option value="admin">مدير نظام ومطور (صلاحيات التحكم الأمني وقواعد البيانات)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-md mt-2"
                >
                  تسجيل الدخول الآمن
                </button>
              </form>

              <div className="border-t border-slate-100 my-6 pt-4 text-center">
                <span className="text-xs text-slate-500">ليس لديك حساب مكتب مفعّل؟</span>{' '}
                <button onClick={() => setCurrentPage('register')} className="text-xs text-indigo-700 font-bold hover:underline">سجل مكتبك الآن مجاناً</button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 3. صفحة التسجيل (Register Page) */}
        {/* ==================================== */}
        {currentPage === 'register' && (
          <div className="max-w-lg mx-auto mt-16 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <div className="text-center mb-6">
                <div className="bg-indigo-900 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-3 shadow">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">إنشاء حساب مكتب محاماة جديد</h2>
                <p className="text-xs text-slate-500 mt-1">ابدأ بتهيئة النظام الرقمي لمكتبك القانوني بثوانٍ معدودة</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                handleRegister(data.get('name') as string, data.get('email') as string, data.get('company') as string);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم المحامي الشريك / المدير</label>
                    <input name="name" type="text" required placeholder="مثال: أ. يحيى السنيدار" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم مكتب المحاماة / الشركة القانونية</label>
                    <input name="company" type="text" required placeholder="مثال: شركة المتحدون للمحاماة" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للمكتب</label>
                  <input name="email" type="email" required placeholder="office@firm.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm" />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-md mt-2"
                >
                  تأكيد تسجيل المكتب والبدء مجاناً
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 4. صفحة استرجاع كلمة المرور (Forgot Password) */}
        {/* ==================================== */}
        {currentPage === 'forgot' && (
          <div className="max-w-md mx-auto mt-24 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 font-bold">استعادة كلمة المرور</h2>
                <p className="text-xs text-slate-500 mt-2">أدخل بريدك الإلكتروني وسيرسل لك خادم سوبابيس رابط آمن لاستعادة كلمة المرور.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني المسجل بالمكتب</label>
                  <input type="email" placeholder="name@firm.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm text-right" />
                </div>
                
                <button 
                  onClick={() => {
                    showAlert('تم إرسال رابط استعادة تعيين كلمة المرور بريدك الإلكتروني بنجاح.', 'success');
                    setCurrentPage('login');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  إرسال كود الاسترجاع
                </button>
                <button 
                  onClick={() => setCurrentPage('login')}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 5. لوحة التحكم والتحليلات (Dashboard) */}
        {/* ==================================== */}
        {currentPage === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            
            <div className="bg-gradient-to-l from-slate-950 via-indigo-950 to-indigo-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-1 text-right">
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-amber-500/30 uppercase">
                    بوابة المحامي المعتمدة لعام 2026
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black mt-2">مرحباً بك، {user.name}</h1>
                  <p className="text-xs text-indigo-200">مكتبك نشط ومحمي بالكامل بسحابة Supabase الأمنية. إليك تحليل الموقف القانوني وأعباء مذكرات المرافعة الجارية.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => { setShowClientModal(true); setEditingClient(null); }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>تسجيل عميل جديد</span>
                  </button>
                  <button 
                    onClick={() => { setShowCaseModal(true); setEditingCase(null); }}
                    className="bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-indigo-700/80 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>فتح قضية جديدة</span>
                  </button>
                  <button 
                    onClick={() => { setShowSessionModal(true); setEditingSession(null); }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-slate-800"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>جدولة جلسة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* بطاقات الإحصائيات الفورية */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'إجمالي القضايا النشطة', value: stats.activeCases, change: '+12% هذا الشهر', desc: 'قضايا تحت المرافعة', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
                { title: 'الموكلين المسجلين', value: stats.totalClients, change: '3 شركات تجارية نشطة', desc: 'دليل عملاء المكتب', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
                { title: 'الجلسات المجدولة', value: stats.upcomingSessions, change: '3 قضايا هذا الأسبوع', desc: 'أجندة الحضور بالمحاكم', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                { title: 'الوثائق والأدلة', value: stats.totalDocuments, change: '12.4 GB مستخدم', desc: 'مؤرشفة ومشفرة بالكامل', icon: FileText, color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/10' }
              ].map((card, idx) => (
                <div key={idx} className={`bg-white p-5 rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-all duration-300 text-right space-y-3`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-slate-400 font-bold">{card.title}</span>
                    <div className={`${card.bg} ${card.color} p-2 rounded-xl`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-800 tracking-tight block font-sans">{card.value}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{card.desc}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{card.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* الرسوم البيانية التفاعلية */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-0.5 text-right">
                    <h3 className="font-extrabold text-slate-900 text-sm">مؤشرات الإيرادات ونشاط القضايا المنجزة</h3>
                    <p className="text-[11px] text-slate-400">تفاعل بالوقوف على الأعمدة لرصد الأرقام والاتعاب المحصلة بدقة لعام 2026.</p>
                  </div>
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => { setActiveChartTab('cases'); setHoveredDataPoint(null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === 'cases' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      معدل القضايا
                    </button>
                    <button 
                      onClick={() => { setActiveChartTab('revenue'); setHoveredDataPoint(null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      أتعاب المحاماة المحصلة
                    </button>
                  </div>
                </div>

                {/* الحاوية الرسومية */}
                <div className="relative pt-6">
                  <div className="h-64 w-full flex items-end justify-between gap-2.5 sm:gap-4 px-2">
                    {MONTHLY_CHART_DATA.map((data, index) => {
                      const maxCases = 25;
                      const maxRevenue = 1000000;
                      const heightPercent = activeChartTab === 'cases' 
                        ? (data.cases / maxCases) * 100 
                        : (data.revenue / maxRevenue) * 100;

                      return (
                        <div 
                          key={index} 
                          className="flex-1 flex flex-col items-center group relative cursor-pointer"
                          onMouseEnter={() => setHoveredDataPoint(data)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        >
                          <div className="w-full bg-slate-50 rounded-2xl h-48 flex items-end overflow-hidden relative border border-slate-100/50">
                            <div 
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 ${
                                activeChartTab === 'cases' ? 'bg-indigo-600' : 'bg-amber-500'
                              }`}
                            >
                              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5"></div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-2.5">{data.month}</span>
                        </div>
                      );
                    })}
                  </div>

                  {hoveredDataPoint && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-right space-y-1.5 z-20 min-w-[160px]">
                      <p className="text-xs font-bold border-b border-slate-800 pb-1 text-slate-400">{hoveredDataPoint.month} 2026</p>
                      {activeChartTab === 'cases' ? (
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-300">القضايا الجديدة: <strong className="text-indigo-400 text-xs font-mono">{hoveredDataPoint.cases} قضية</strong></p>
                          <p className="text-[11px] text-slate-300">تم الفصل فيها: <strong className="text-emerald-400 text-xs font-mono">{hoveredDataPoint.resolved} قضية</strong></p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[11px] text-slate-300">إجمالي المقبوضات:</p>
                          <p className="text-sm font-black text-amber-400 font-mono mt-0.5">{hoveredDataPoint.revenue.toLocaleString()} ر.ي</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* تحليلات الأداء القانوني */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-right">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm">تحليل الأداء القانوني الإجمالي</h3>
                  <p className="text-[11px] text-slate-400">إحصائيات النجاح ومعدل تسوية القضايا ودياً.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'نسبة النجاح وكسب الأحكام', value: '87%', color: 'bg-emerald-500', text: 'text-emerald-600' },
                    { label: 'التسويات الودية والصلح الناجح', value: '64%', color: 'bg-amber-500', text: 'text-amber-600' },
                    { label: 'التزام الرد المتبادل وتقديم العرائض', value: '94%', color: 'bg-indigo-600', text: 'text-indigo-600' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">{item.label}</span>
                        <span className={`font-black ${item.text}`}>{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.value }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-right">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>تنبيه الموقف المالي للمكتب</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    هناك مبلغ **245,000 ريال يمني** معلق كمتبقي أتعاب مرافعة جارية لمجموعة هائل سعيد أنعم بانتظار تقديم حكم الاستئناف المصدق من وزارة الصناعة والتجارة اليمنية.
                  </p>
                </div>
              </div>

            </div>

            {/* الجلسات القادمة اليوم وغداً */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-700" />
                    <h3 className="font-bold text-slate-800 text-sm">الجلسات القادمة والمثول القانوني</h3>
                  </div>
                  <button onClick={() => setCurrentPage('sessions')} className="text-xs text-indigo-700 font-bold hover:underline">عرض التقويم بالكامل</button>
                </div>

                <div className="space-y-3.5">
                  {sessions.map((session, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 hover:border-amber-500/20 transition-all text-right space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-extrabold text-slate-800 text-xs line-clamp-1">{session.caseTitle}</span>
                        <span className="bg-amber-100 text-amber-900 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                          {session.time}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 items-center">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.court}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{session.date}</span>
                        </span>
                      </div>

                      <div className="border-t border-slate-200/50 pt-2.5 flex justify-between items-center text-[11px]">
                        <span className="text-indigo-700 font-bold">المهمة بالجلسة: {session.type}</span>
                        <span className="text-slate-400">ملاحظة: {session.notes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-right">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800 text-sm">آخر الملفات والعرائض المرفوعة</h3>
                  </div>
                  <button onClick={() => setCurrentPage('documents')} className="text-xs text-indigo-700 font-bold hover:underline">المستندات</button>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 text-right">
                        <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{doc.title}</span>
                          <span className="text-[9px] text-slate-400 block">الحجم: {doc.size} | تاريخ الرفع: {doc.dateUploaded}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => showAlert('تم استدعاء الرابط وبدء تحميل المستند من سحابة Supabase.')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        title="تحميل مستند"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowDocumentModal(true)}
                  className="w-full text-center py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold transition-all"
                >
                  رفع مستند قانوني جديد (PDF)
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 6. صفحة إدارة العملاء (Clients Management) */}
        {/* ==================================== */}
        {currentPage === 'clients' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="space-y-1 text-right">
                <h1 className="text-2xl font-black text-slate-900 font-bold">إدارة دليل الموكلين والعملاء</h1>
                <p className="text-xs text-slate-500 font-medium font-sans">سجل ببيانات الموكلين الأفراد وممثلي الشركات ومتابعة نشاطاتهم القانونية ومستحقاتهم.</p>
              </div>
              <button 
                onClick={() => setShowAddClientForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>إضافة عميل / موكل جديد</span>
              </button>
            </div>

            {/* شريط البحث */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن اسم العميل، رقم الهاتف، أو العنوان..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xs text-right"
                />
              </div>
            </div>

            {/* جدول الموكلين */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">اسم الموكل</th>
                      <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                      <th className="py-3.5 px-4 font-bold">البريد الإلكتروني</th>
                      <th className="py-3.5 px-4 font-bold">نوع الكيان</th>
                      <th className="py-3.5 px-4 font-bold">العنوان ومحل الإقامة</th>
                      <th className="py-3.5 px-4 font-bold">عدد القضايا النشطة</th>
                      <th className="py-3.5 px-4 font-bold text-center">خيارات الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">{client.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{client.phone}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{client.email || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            client.type === 'شركة تجارية' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {client.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{client.address}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700 font-mono text-sm">{client.casesCount}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingClient(client);
                                setNewClient({ name: client.name, phone: client.phone, email: client.email, address: client.address, type: client.type });
                                setShowClientModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="تعديل بيانات العميل"
                            >
                              <Edit3 className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => deleteClient(client.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="حذف العميل"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 7. صفحة إدارة ملفات القضايا (Cases Management) */}
        {/* ==================================== */}
        {currentPage === 'cases' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 font-bold">أرشيف وإدارة ملفات القضايا</h1>
                <p className="text-xs text-slate-500 font-medium">افتح، راقب، وعدّل القضايا المعروضة أمام المحاكم اليمنية ومتابعة مستنداتها.</p>
              </div>
              <button 
                onClick={() => setShowAddCaseForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>فتح ملف قضية جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:border-amber-500/30 transition-all text-right">
                  <div className="flex justify-between items-start gap-3">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold text-xs px-2.5 py-1 rounded">
                      رقم {caseItem.caseNo}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      caseItem.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' :
                      caseItem.status === 'جلسة قادمة' ? 'bg-amber-100 text-amber-800' :
                      caseItem.status === 'تحت الدراسة' ? 'bg-blue-100 text-indigo-900' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug line-clamp-2">{caseItem.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{caseItem.description}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">العميل الموكل:</span>
                      <span className="font-bold text-slate-800">{caseItem.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المحكمة المختصة:</span>
                      <span className="font-bold text-slate-700">{caseItem.court}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تصنيف الدعوى:</span>
                      <span className="font-semibold text-indigo-700">{caseItem.category}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                    <span className="text-slate-400">بدأت في: {caseItem.dateStarted}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setEditingCase(caseItem);
                          setNewCase({ 
                            title: caseItem.title, 
                            clientId: caseItem.clientId, 
                            category: caseItem.category, 
                            status: caseItem.status, 
                            court: caseItem.court, 
                            caseNo: caseItem.caseNo, 
                            lawyerId: caseItem.lawyerId, 
                            description: caseItem.description 
                          });
                          setShowCaseModal(true);
                        }}
                        className="px-3 py-1.5 hover:bg-indigo-50 text-indigo-700 rounded-lg font-bold transition-all"
                      >
                        تعديل الملف
                      </button>
                      <button 
                        onClick={() => deleteCase(caseItem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 8. صفحة إدارة الجلسات ومواعيد المحكمة (Sessions) */}
        {/* ==================================== */}
        {currentPage === 'sessions' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 font-bold">أجندة مواعيد وجلسات المحاكم</h1>
                <p className="text-xs text-slate-500 font-medium">متابعة دقيقة لمواعيد الحضور والمرافعة وتقديم الدفوع ومتابعة قرارات القضاة اليومية.</p>
              </div>
              <button 
                onClick={() => { setShowSessionModal(true); setEditingSession(null); }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>جدولة موعد جلسة جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">القضية المرتبطة</th>
                      <th className="py-3 px-4 font-bold">المحكمة / الدائرة القانونية</th>
                      <th className="py-3 px-4 font-bold">تاريخ الجلسة</th>
                      <th className="py-3 px-4 font-bold">الوقت والانعقاد</th>
                      <th className="py-3 px-4 font-bold">نوع وموضوع الجلسة</th>
                      <th className="py-3 px-4 font-bold">الملاحظات والطلبات</th>
                      <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800 max-w-xs">{session.caseTitle}</td>
                        <td className="py-4 px-4 text-slate-600">{session.court}</td>
                        <td className="py-4 px-4 font-bold text-indigo-800">{session.date}</td>
                        <td className="py-4 px-4">
                          <span className="bg-amber-100 text-amber-900 font-mono font-bold px-2 py-1 rounded text-xs">{session.time}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-semibold">{session.type}</td>
                        <td className="py-4 px-4 text-slate-500 max-w-xs">{session.notes || '—'}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingSession(session);
                                setNewSession({ 
                                  caseId: session.caseId, 
                                  court: session.court, 
                                  date: session.date, 
                                  time: session.time, 
                                  status: session.status, 
                                  type: session.type, 
                                  notes: session.notes 
                                });
                                setShowSessionModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit3 className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              onClick={() => deleteSession(session.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 9. صفحة خزانة المستندات والوثائق (Documents) */}
        {/* ==================================== */}
        {currentPage === 'documents' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 font-bold">خزانة المستندات والملفات الآمنة</h1>
                <p className="text-xs text-slate-500 font-medium">تخزين ومشاركة العرائض والأدلة وبطاقات الهوية القانونية على سحابة Supabase ومزامنتها لحظياً.</p>
              </div>
              <button 
                onClick={() => setShowDocumentModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>رفع وثيقة جديدة (PDF / Word)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:border-indigo-500/20 transition-all text-right">
                  <div className="flex justify-between items-start">
                    <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold">
                      {doc.size}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{doc.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">القضية: {doc.caseTitle}</p>
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold mt-1">
                      {doc.category}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                    <span>رُفعت في: {doc.dateUploaded}</span>
                    <button 
                      onClick={() => showAlert('تم استدعاء الرابط وبدء تحميل المستند من خزانة Supabase.')}
                      className="text-indigo-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل المستند</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 10. صفحة إدارة المحامين (Lawyers) */}
        {/* ==================================== */}
        {currentPage === 'lawyers' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 font-bold">أعضاء المكتب والشركاء الممارسين</h1>
                <p className="text-xs text-slate-500 font-medium">قائمة المحامين والشركاء في مجموعة اليماني القانونية لإدارة المرافعات.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
              {lawyers.map((lawyer) => (
                <div key={lawyer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border border-slate-100 flex items-center justify-center text-indigo-950 font-bold mx-auto text-lg">
                    {lawyer.name.substring(3, 5)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{lawyer.name}</h3>
                    <p className="text-[10px] text-amber-600 font-bold">{lawyer.role}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{lawyer.specialization}</p>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-1 text-[11px] text-slate-400">
                    <span className="font-mono">{lawyer.email}</span>
                    <span className="font-mono">{lawyer.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 11. صفحة التقارير المالية (Reports) */}
        {/* ==================================== */}
        {currentPage === 'reports' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right">
              <h1 className="text-2xl font-black text-slate-900 font-bold">مؤشرات الأداء القانوني والتحليلات المالية</h1>
              <p className="text-xs text-slate-500 font-medium">متابعة إيرادات الأتعاب، كفاءة إغلاق القضايا ونسب كسب الأحكام.</p>
            </div>

            {!checkAccess(['admin', 'firm_manager']) ? (
              <div className="bg-white p-12 rounded-2xl border border-red-100 text-center space-y-4">
                <Lock className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="font-extrabold text-slate-800 text-base">عذراً، الوصول غير مصرح به</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  تقتصر صلاحية استعراض التقارير المالية وتحليل إيرادات المكتب على (مدراء المكاتب ومسؤولي النظام الكاملين) فقط طبقاً لسياسات السرية الخاصة بـ LegalMind.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 text-right shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm">أتعاب المحاماة الإجمالية</h3>
                  <div className="text-3xl font-black text-emerald-600 font-mono font-sans">٣,٣٧٠,٠٠٠ ر.ي</div>
                  <p className="text-xs text-slate-400">إجمالي الإيرادات المسجلة عبر الحسابات البنكية ومكاتب الصرافة المعتمدة.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 text-right shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm">معدل الفوز بالأحكام المنجزة</h3>
                  <div className="text-3xl font-black text-indigo-600 font-mono font-sans">٨٧.٥%</div>
                  <p className="text-xs text-slate-400">نسبة كسب القضايا التجارية والمدنية المسجلة لعام 2026.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================== */}
        {/* 12. صفحة باقة الاشتراك والفوترة (Subscription) */}
        {/* ==================================== */}
        {currentPage === 'subscription' && user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8 text-right">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-right space-y-1">
              <h1 className="text-2xl font-black text-slate-900 font-bold">باقة اشتراك المكتب وفواتير التجديد</h1>
              <p className="text-xs text-slate-500 font-medium">حالة الاشتراك الحالية وتفاصيل التحويل لشركات الصرافة اليمنية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SUBSCRIPTION_PLANS.map((plan, idx) => (
                <div key={idx} className={`bg-white rounded-2xl border p-8 flex flex-col justify-between relative ${plan.color}`}>
                  {plan.badge && (
                    <span className="absolute -top-3 right-6 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow">
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2">{plan.name}</h3>
                    <div className="my-6">
                      <span className="text-3xl font-black text-slate-900 font-sans">{plan.price}</span>
                      <span className="text-xs text-slate-400 mr-2">ريال يمني / {plan.period}</span>
                    </div>
                    <div className="border-t border-slate-100 my-6"></div>
                    <ul className="space-y-3 text-xs text-slate-600">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      showAlert(`تم طلب باقة ${plan.name} بنجاح، سيقوم ممثل المبيعات بالتواصل معك عبر الهاتف لتأكيد السند التمويلي للتحويل.`);
                    }}
                    className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors"
                  >
                    ترقية / تجديد الآن
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 13. صفحة الملف الشخصي للمستخدم (User Profile) */}
        {/* ==================================== */}
        {currentPage === 'profile' && user && (
          <div className="max-w-3xl mx-auto mt-6 px-4 space-y-6 text-right">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-bold">الملف المهني والترخيص العدلي</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">الاسم الرباعي الكامل</label>
                  <input type="text" defaultValue={user.name} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">البريد الإلكتروني المهني</label>
                  <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-right bg-slate-100 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">رقم الترخيص القانوني</label>
                  <input type="text" defaultValue={user.licenseNo || 'لم يسجل'} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">رقم الجوال اليمني</label>
                  <input type="text" defaultValue={user.phone} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50" />
                </div>
              </div>

              <button 
                onClick={() => {
                  showAlert('تم تحديث وحفظ بيانات الترخيص والملف الشخصي بنجاح.');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                حفظ التعديلات والترخيص
              </button>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 14. صفحة الإعدادات وتخصيص النظام (Settings) */}
        {/* ==================================== */}
        {currentPage === 'settings' && user && (
          <div className="max-w-3xl mx-auto mt-6 px-4 space-y-6 text-right">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 font-bold">إعدادات النظام والمكتب القانوني</h2>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">تفعيل إشعارات الواتساب للموكلين</h4>
                    <p className="text-slate-400 mt-0.5">إرسال تفاصيل ومواعيد المحاكمة والطلبات وتاريخ الجلسة لهاتف الموكل تلقائياً.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4.5 h-4.5 text-indigo-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">حظر رؤية المتدربين للمبالغ المالية</h4>
                    <p className="text-slate-400 mt-0.5">تأمين حجب المذكرات المالية وحساب الأتعاب الإجمالي عن حسابات الموظفين والمتدربين.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4.5 h-4.5 text-indigo-600" />
                </div>
              </div>

              <button 
                onClick={() => showAlert('تم حفظ إعدادات حوكمة المكتب بنجاح.')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                تحديث إعدادات الأمان
              </button>
            </div>
          </div>
        )}

      </main>

      {/* --- نوافذ الإدخال المنبثقة (Modals) --- */}

      {/* 1. نافذة إضافة وتعديل عميل */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 font-bold">
                {editingClient ? 'تعديل بيانات الموكل العميل' : 'تسجيل موكل عميل جديد بالمكتب'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="p-1 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">اسم الموكل</label>
                <input 
                  type="text" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="الاسم الثلاثي أو الرباعي"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">رقم الهاتف اليمني</label>
                  <input 
                    type="text" 
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right font-mono"
                    placeholder="770000000"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">نوع الكيان</label>
                  <select 
                    value={newClient.type}
                    onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right bg-white"
                  >
                    <option value="فرد">فرد</option>
                    <option value="شركة تجارية">شركة تجارية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">العنوان ومحل الإقامة</label>
                <input 
                  type="text" 
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="المحافظة - المديرية - الشارع"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
              <button onClick={() => setShowClientModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50">
                إلغاء الأمر
              </button>
              <button onClick={saveClient} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
                حفظ العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. نافذة إضافة وتعديل قضية */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 font-bold">
                {editingCase ? 'تعديل ملف القضية' : 'فتح ملف مرافعة وقضية جديدة'}
              </h3>
              <button onClick={() => setShowCaseModal(false)} className="p-1 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">موضوع القضية الرئيسي</label>
                <input 
                  type="text" 
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="عنوان القضية في سجلات المحكمة"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">الموكل</label>
                  <select 
                    value={newCase.clientId}
                    onChange={(e) => setNewCase({ ...newCase, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                  >
                    <option value="">اختر العميل الموكل...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">تصنيف الدعوى</label>
                  <select 
                    value={newCase.category}
                    onChange={(e) => setNewCase({ ...newCase, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                  >
                    <option value="تجاري">تجاري</option>
                    <option value="مدني">مدني</option>
                    <option value="عقاري">عقاري</option>
                    <option value="عمالي">عمالي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">المحكمة المختصة</label>
                  <input 
                    type="text" 
                    value={newCase.court}
                    onChange={(e) => setNewCase({ ...newCase, court: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                    placeholder="اسم المحكمة والدائرة"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">رقم القضية في المحكمة</label>
                  <input 
                    type="text" 
                    value={newCase.caseNo}
                    onChange={(e) => setNewCase({ ...newCase, caseNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right font-mono"
                    placeholder="مثال: ١٤٥/ب/٢٠٢٦"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">المحامي المباشر</label>
                <select 
                  value={newCase.lawyerId}
                  onChange={(e) => setNewCase({ ...newCase, lawyerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                >
                  <option value="">اختر المحامي المسؤول...</option>
                  {lawyers.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">ملخص القضية والادعاءات</label>
                <textarea 
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  rows={2}
                  placeholder="اكتب تفاصيل وملخص الخصومة وطلبات الموكل..."
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
              <button onClick={() => setShowCaseModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50">
                إلغاء الأمر
              </button>
              <button onClick={saveCase} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
                حفظ ملف القضية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. نافذة جدولة جلسة محكمة جديدة */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 font-bold">
                {editingSession ? 'تحديث الجلسة' : 'جدولة وحجز موعد جلسة محكمة'}
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="p-1 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">الملف القضائي</label>
                <select 
                  value={newSession.caseId}
                  onChange={(e) => setNewSession({ ...newSession, caseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                >
                  <option value="">اختر القضية المعنية...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">المحكمة ومقر انعقاد الدائرة</label>
                <input 
                  type="text" 
                  value={newSession.court}
                  onChange={(e) => setNewSession({ ...newSession, court: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="مثال: محكمة استئناف الأمانة - الشعبة التجارية الثالثة"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">تاريخ انعقاد الجلسة</label>
                  <input 
                    type="date" 
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">الوقت</label>
                  <input 
                    type="time" 
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">نوع وموضوع الجلسة</label>
                <input 
                  type="text" 
                  value={newSession.type}
                  onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="مثال: تقديم مذكرات الرد والدفوع"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">ملاحظات وطلبات القضاة</label>
                <input 
                  type="text" 
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="المستندات أو الحضور الشخصي المطلوب"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
              <button onClick={() => setShowSessionModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50">
                إلغاء الموعد
              </button>
              <button onClick={saveSession} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
                جدولة الجلسة بالتقويم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. نافذة رفع مستند جديد */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-right animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 font-bold">تخزين ورفع مستند قانوني آمن</h3>
              <button onClick={() => setShowDocumentModal(false)} className="p-1 hover:bg-slate-50 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">اسم المستند</label>
                <input 
                  type="text" 
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-right"
                  placeholder="مثال: عريضة استئناف حكم"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">ربط المستند بالقضية</label>
                <select 
                  value={newDocument.caseId}
                  onChange={(e) => setNewDocument({ ...newDocument, caseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                >
                  <option value="">حدد القضية المرتبطة...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">تصنيف المستند</label>
                <select 
                  value={newDocument.category}
                  onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white text-right"
                >
                  <option value="عريضة دعوى">عريضة دعوى</option>
                  <option value="أدلة إثبات">أدلة إثبات</option>
                  <option value="توكيلات رسمية">توكيلات رسمية</option>
                  <option value="تقارير فنية">تقارير فنية</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 cursor-pointer hover:bg-slate-50 transition-colors">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <span className="block text-xs font-bold text-slate-600">اضغط هنا أو اسحب الملف للرفع الفوري</span>
                <span className="block text-[10px] text-slate-400">PDF, DOCX, PNG (حجم أقصى 20 ميجابايت)</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
              <button onClick={() => setShowDocumentModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50">
                إلغاء الأمر
              </button>
              <button onClick={uploadDocument} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs">
                رفع المستند لـ Supabase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة عميل جديد */}
      <AddClientForm
        isOpen={showAddClientForm}
        onClose={() => setShowAddClientForm(false)}
        onClientAdded={handleAddClient}
        onError={(error) => showAlert(error, 'error')}
        onSuccess={(message) => showAlert(message, 'success')}
      />

      {/* نموذج إضافة قضية جديدة */}
      <AddCaseForm
        isOpen={showAddCaseForm}
        onClose={() => setShowAddCaseForm(false)}
        onCaseAdded={handleAddCase}
        onError={(error) => showAlert(error, 'error')}
        onSuccess={(message) => showAlert(message, 'success')}
        clients={clients}
      />

    </div>
  );
}