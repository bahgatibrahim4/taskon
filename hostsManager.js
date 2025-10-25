const fs = require('fs');
const { execSync } = require('child_process');

async function addSubdomainToHosts(subdomain) {
  try {
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const domainEntry = `127.0.0.1 ${subdomain}.taskon.local`;
    
    // Read current hosts file
    let hostsContent = '';
    try {
      hostsContent = fs.readFileSync(hostsPath, 'utf8');
    } catch (err) {
      console.log('⚠️ Cannot read hosts file:', err.message);
      return false;
    }
    
    // Check if domain already exists
    if (hostsContent.includes(`${subdomain}.taskon.local`)) {
      console.log(`ℹ️ Domain ${subdomain}.taskon.local already exists in hosts file`);
      return true;
    }
    
    try {
      // Try to add the domain directly
      fs.appendFileSync(hostsPath, `\n${domainEntry}`);
      console.log(`✅ Added ${subdomain}.taskon.local to hosts file`);
      
      // Flush DNS cache
      try {
        execSync('ipconfig /flushdns', { stdio: 'pipe' });
        console.log('✅ DNS cache flushed');
      } catch (err) {
        console.log('⚠️ Could not flush DNS cache:', err.message);
      }
      
      return true;
    } catch (err) {
      console.log(`⚠️ Cannot add domain to hosts file (permission denied): ${err.message}`);
      console.log(`💡 Please run this as Administrator or manually add: ${domainEntry}`);
      return false;
    }
  } catch (err) {
    console.error('❌ Error in addSubdomainToHosts:', err);
    return false;
  }
}

module.exports = { addSubdomainToHosts };