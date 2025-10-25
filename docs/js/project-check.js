// التحقق من اختيار المشروع وتوفير projectId عالمياً
(function() {
  'use strict';
  
  // التحقق من تسجيل الدخول
  const user = localStorage.getItem('user') || localStorage.getItem('currentUser');
  if (!user && window.location.pathname !== '/login.html') {
    window.location.href = 'login.html';
    return;
  }
  
  // التحقق من اختيار المشروع (تجاهل صفحات معينة)
  const ignorePages = ['login.html', 'projects.html', 'index.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (!ignorePages.includes(currentPage)) {
    const currentProjectId = localStorage.getItem('currentProjectId');
    const currentProjectName = localStorage.getItem('currentProjectName');
    
    if (!currentProjectId) {
      alert('الرجاء اختيار مشروع أولاً');
      window.location.href = 'projects.html';
      return;
    }
    
    // إتاحة projectId عالمياً
    window.PROJECT_ID = currentProjectId;
    window.PROJECT_NAME = currentProjectName;
    
    console.log('✅ Project selected:', currentProjectName, '(ID:', currentProjectId + ')');
  }
  
  // دالة مساعدة لإضافة projectId للطلبات
  window.addProjectId = function(data) {
    if (typeof data === 'object' && data !== null) {
      if (data instanceof FormData) {
        data.append('projectId', window.PROJECT_ID);
      } else {
        data.projectId = window.PROJECT_ID;
      }
    }
    return data;
  };
  
  // دالة مساعدة لبناء URL مع projectId
  window.buildProjectURL = function(baseURL) {
    const separator = baseURL.includes('?') ? '&' : '?';
    return `${baseURL}${separator}projectId=${window.PROJECT_ID}`;
  };
})();
