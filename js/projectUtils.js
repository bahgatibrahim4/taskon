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
  
  // تحديد API_URL بناءً على البيئة
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://taskon-qzj8.onrender.com';
  
  // إضافة projectId و companyId كـ query parameters
  const urlObj = new URL(url, API_URL);
  if (projectId && !urlObj.searchParams.has('projectId')) {
    urlObj.searchParams.set('projectId', projectId);
  }
  if (companyId && !urlObj.searchParams.has('companyId')) {
    urlObj.searchParams.set('companyId', companyId);
  }
  
  // إضافة headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
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
  
  return fetch(urlObj.toString(), options);
}

/**
 * دالة GET محسّنة مع projectId
 */
async function getWithProject(url) {
  const projectId = getCurrentProjectId();
  const separator = url.includes('?') ? '&' : '?';
  
  // تحديد API_URL بناءً على البيئة
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://taskon-qzj8.onrender.com';
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
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
  
  // تحديد API_URL بناءً على البيئة
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://taskon-qzj8.onrender.com';
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
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
  
  // تحديد API_URL بناءً على البيئة
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://taskon-qzj8.onrender.com';
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
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
  // تحديد API_URL بناءً على البيئة
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://taskon-qzj8.onrender.com';
  
  // إضافة origin إذا لم يكن موجود
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
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
    window.location.href = 'projects.html';
    return false;
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
    // دوال معالجة معامل الشركة
    getCurrentCompanyParam() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('company') || localStorage.getItem('currentCompany');
    },
    
    setCompanyParam(company) {
      if (company) {
        localStorage.setItem('currentCompany', company);
      }
    },
    
    createUrlWithCompany(baseUrl, company = null) {
      const companyParam = company || this.getCurrentCompanyParam();
      if (companyParam && !baseUrl.includes('?company=')) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}company=${companyParam}`;
      }
      return baseUrl;
    },
    
    ensureCompanyInUrl() {
      const currentCompany = this.getCurrentCompanyParam();
      if (currentCompany && !window.location.search.includes('company=')) {
        const newUrl = this.createUrlWithCompany(window.location.href, currentCompany);
        if (newUrl !== window.location.href) {
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  };
}

console.log('✅ تم تحميل projectUtils.js بنجاح');
