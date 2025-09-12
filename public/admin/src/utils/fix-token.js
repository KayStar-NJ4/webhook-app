// Script to fix token issues
export const fixTokenIssue = () => {
  
  // Check current token
  const currentToken = localStorage.getItem('token')
  const currentUser = localStorage.getItem('user')
  
  if (!currentToken) {
    window.location.href = '/admin/login'
    return
  }
  
  // Create a test request
  const testRequest = async () => {
    try {
      const response = await fetch('/api/admin/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        return true
      } else {
        localStorage.clear()
        window.location.href = '/admin/login'
        return false
      }
    } catch (error) {
      return false
    }
  }
  
  testRequest()
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.fixTokenIssue = fixTokenIssue
}
