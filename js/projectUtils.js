/**
 * ملف JavaScript مشترك لجميع صفحات المشروع
 * يحتوي على دوال مساعدة لإضافة projectId تلقائياً
 */

// الحصول على معلومات المشروع الحالي
function getCurrentProjectId() {
  return localStorage.getItem('currentProjectId');
}

function getCurrentProjectName() {
  return localStorage.getItem('currentProjectName');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function getCurrentCompanyId() {
  const user = getCurrentUser();
  return user ? user.companyId : null;
}

/**
 * دالة fetch محسّنة تضيف projectId تلقائياً
 * @param {string} url - الرابط
 * @param {object} options - خيارات fetch
 * @returns {Promise<Response>}
 */
async function fetchWithProject(url, options = {}) {
  const projectId = getCurrentProjectId();
  const companyId = getCurrentCompanyId();
  
  // إضافة headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (projectId) {
    options.headers['X-Project-ID'] = projectId;
  }
  
  if (companyId) {
    options.headers['X-Company-ID'] = companyId;
  }
  
  // إضافة projectId للـ body إذا كان POST أو PUT
  if ((options.method === 'POST' || options.method === 'PUT') && options.body) {
    try {
      const bodyData = JSON.parse(options.body);
      if (projectId && !bodyData.projectId) {
        bodyData.projectId = projectId;
      }
      if (companyId && !bodyData.companyId) {
        bodyData.companyId = companyId;
      }
      options.body = JSON.stringify(bodyData);
    } catch (e) {
      // إذا لم يكن JSON، اتركه كما هو
    }
  }
  
  return fetch(url, options);
}

/**
 * دالة GET محسّنة مع projectId
 */
async function getWithProject(url) {
  const projectId = getCurrentProjectId();
  const separator = url.includes('?') ? '&' : '?';
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const urlWithProject = projectId ? `${fullUrl}${separator}projectId=${projectId}` : fullUrl;
  
  const response = await fetchWithProject(urlWithProject, {
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * دالة POST محسّنة مع projectId
 */
async function postWithProject(url, data = {}) {
  const projectId = getCurrentProjectId();
  const companyId = getCurrentCompanyId();
  
  if (projectId) data.projectId = projectId;
  if (companyId) data.companyId = companyId;
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  
  const response = await fetchWithProject(fullUrl, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  return response;
}

/**
 * دالة PUT محسّنة مع projectId
 */
async function putWithProject(url, data = {}) {
  const projectId = getCurrentProjectId();
  const companyId = getCurrentCompanyId();
  
  if (projectId) data.projectId = projectId;
  if (companyId) data.companyId = companyId;
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  
  const response = await fetchWithProject(fullUrl, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  return response;
}

/**
 * دالة DELETE محسّنة مع projectId
 */
async function deleteWithProject(url) {
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  
  const response = await fetchWithProject(fullUrl, {
    method: 'DELETE'
  });
  
  return response;
}

/**
 * التحقق من وجود مشروع محدد
 */
function checkProjectSelected() {
  const projectId = getCurrentProjectId();
  if (!projectId) {
    alert('الرجاء اختيار مشروع أولاً');
    const companyParam = getCompanyUrlParam();
    window.location.href = `projects.html${companyParam}`;
    return false;
  }
  return true;
}

/**
 * الحصول على company parameter من URL
 */
function getCompanyUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyParam = urlParams.get('company') || urlParams.get('companyId');
  return companyParam ? `?company=${companyParam}` : '';
}

/**
 * إنشاء URL مع company parameter
 */
function createUrlWithCompany(baseUrl) {
  const companyParam = getCompanyUrlParam();
  return `${baseUrl}${companyParam}`;
}

/**
 * التحقق من صحة URL الشركة وإعادة التوجيه إذا لزم الأمر
 */
function ensureCompanyURL() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.companyId || currentUser.companyId === 'default-company-001') {
    return true; // لا نحتاج للتحقق
  }

  const hostname = window.location.hostname;
  const currentDomain = window.location.origin;
  
  // إذا كنا في localhost أو production domain بدون subdomain
  if (hostname === 'localhost' || hostname.includes('render.com') || hostname.includes('onrender.com')) {
    // تحقق إذا كان لدينا معرف شركة في URL
    const urlParams = new URLSearchParams(window.location.search);
    const companyParam = urlParams.get('company') || urlParams.get('companyId');
    
    if (!companyParam) {
      // إعادة توجيه مع معرف الشركة
      const currentPath = window.location.pathname;
      const newUrl = `${currentDomain}${currentPath}?company=${currentUser.companyId}`;
      console.log('🔄 Redirecting to company URL:', newUrl);
      window.location.replace(newUrl);
      return false;
    }
  }
  
  return true;
}

/**
 * التحقق من وجود subdomain (الشركة)
 */
function checkSubdomain(redirectPage = 'platform-landing.html') {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const hasSubdomain = parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www';
  
  if (!hasSubdomain) {
    alert('⚠️ يجب الدخول من خلال نطاق الشركة!\n\nمثال: http://company.taskon.local:4000\n\nالرجاء استخدام رابط الشركة الصحيح.');
    window.location.replace(redirectPage);
    return false;
  }
  
  return true;
}

/**
 * التحقق من تسجيل الدخول والمشروع
 */
function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace('login.html');
    return false;
  }
  
  return checkProjectSelected();
}

// تصدير الدوال للاستخدام في الصفحات
if (typeof window !== 'undefined') {
  window.projectUtils = {
    getCurrentProjectId,
    getCurrentProjectName,
    getCurrentUser,
    getCurrentCompanyId,
    fetchWithProject,
    getWithProject,
    postWithProject,
    putWithProject,
    deleteWithProject,
    checkProjectSelected,
    checkAuth,
    checkSubdomain,
    getCompanyUrlParam,
    createUrlWithCompany,
    ensureCompanyURL
  };
}

console.log('✅ تم تحميل projectUtils.js بنجاح');
