import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ASTERISK_CONFIG_PATH = process.env.ASTERISK_CONFIG_PATH || '/etc/asterisk';
const EXTENSIONS_CUSTOM_FILE = path.join(ASTERISK_CONFIG_PATH, 'extensions_custom.conf');

interface DialplanEntry {
  did: string;
  destination: string;
  routingType: string;
  context?: string;
}

export class AsteriskConfigManager {
  /**
   * Add a DID to Asterisk dialplan automatically
   */
  async addDIDToDialplan(entry: DialplanEntry): Promise<void> {
    const { did, destination, routingType, context = 'from-trunk' } = entry;
    
    // Generate dialplan entry based on routing type
    const dialplanContent = this.generateDialplanEntry(did, destination, routingType, context);
    
    // Append to custom extensions file
    await this.appendToExtensionsFile(dialplanContent);
    
    // Reload Asterisk dialplan
    await this.reloadAsteriskDialplan();
  }

  /**
   * Generate dialplan configuration for a DID
   */
  private generateDialplanEntry(did: string, destination: string, routingType: string, context: string): string {
    const sanitizedDID = this.sanitizeDID(did);
    
    let dialplanEntry = `\n; Auto-generated for DID: ${did}\n`;
    dialplanEntry += `[${context}]\n`;
    
    switch (routingType) {
      case 'direct':
        dialplanEntry += `exten => ${sanitizedDID},1,NoOp(Incoming call to ${did})\n`;
        dialplanEntry += ` same => n,Set(CDR(did)=${did})\n`;
        dialplanEntry += ` same => n,Dial(PJSIP/${destination},60,tT)\n`;
        dialplanEntry += ` same => n,Hangup()\n`;
        break;
        
      case 'queue':
        dialplanEntry += `exten => ${sanitizedDID},1,NoOp(Incoming call to ${did})\n`;
        dialplanEntry += ` same => n,Set(CDR(did)=${did})\n`;
        dialplanEntry += ` same => n,Answer()\n`;
        dialplanEntry += ` same => n,Queue(${destination},tT,,,300)\n`;
        dialplanEntry += ` same => n,Hangup()\n`;
        break;
        
      case 'ivr':
        dialplanEntry += `exten => ${sanitizedDID},1,NoOp(Incoming call to ${did})\n`;
        dialplanEntry += ` same => n,Set(CDR(did)=${did})\n`;
        dialplanEntry += ` same => n,Answer()\n`;
        dialplanEntry += ` same => n,Background(welcome)\n`;
        dialplanEntry += ` same => n,WaitExten(10)\n`;
        dialplanEntry += ` same => n,Hangup()\n`;
        break;
        
      case 'voicemail':
        dialplanEntry += `exten => ${sanitizedDID},1,NoOp(Incoming call to ${did})\n`;
        dialplanEntry += ` same => n,Set(CDR(did)=${did})\n`;
        dialplanEntry += ` same => n,VoiceMail(${destination}@default,su)\n`;
        dialplanEntry += ` same => n,Hangup()\n`;
        break;
        
      default:
        // Default to AGI routing
        dialplanEntry += `exten => ${sanitizedDID},1,NoOp(Incoming call to ${did})\n`;
        dialplanEntry += ` same => n,Set(CDR(did)=${did})\n`;
        dialplanEntry += ` same => n,AGI(agi://127.0.0.1:4573)\n`;
        dialplanEntry += ` same => n,Hangup()\n`;
    }
    
    dialplanEntry += `\n`;
    return dialplanEntry;
  }

  /**
   * Remove a DID from Asterisk dialplan
   */
  async removeDIDFromDialplan(did: string): Promise<void> {
    const sanitizedDID = this.sanitizeDID(did);
    
    try {
      // Read current extensions file
      const content = await fs.promises.readFile(EXTENSIONS_CUSTOM_FILE, 'utf-8');
      
      // Remove lines related to this DID
      const lines = content.split('\n');
      const filteredLines: string[] = [];
      let skipSection = false;
      
      for (const line of lines) {
        if (line.includes(`Auto-generated for DID: ${did}`)) {
          skipSection = true;
          continue;
        }
        
        if (skipSection) {
          // Skip until we find a new section or empty line
          if (line.trim() === '' || line.startsWith(';') || line.startsWith('[')) {
            skipSection = false;
          } else {
            continue;
          }
        }
        
        if (!line.includes(`exten => ${sanitizedDID},`)) {
          filteredLines.push(line);
        }
      }
      
      // Write back filtered content
      await fs.promises.writeFile(EXTENSIONS_CUSTOM_FILE, filteredLines.join('\n'));
      
      // Reload dialplan
      await this.reloadAsteriskDialplan();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('Extensions custom file does not exist yet');
      } else {
        throw error;
      }
    }
  }

  /**
   * Append content to extensions custom file
   */
  private async appendToExtensionsFile(content: string): Promise<void> {
    try {
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(EXTENSIONS_CUSTOM_FILE), { recursive: true });
      
      // Check if file exists, if not create with header
      try {
        await fs.promises.access(EXTENSIONS_CUSTOM_FILE);
      } catch {
        const header = `; Custom Extensions - Auto-generated by Gulf Premium Telecom\n`;
        header += `; WARNING: This file is managed automatically. Manual changes may be overwritten.\n\n`;
        await fs.promises.writeFile(EXTENSIONS_CUSTOM_FILE, header);
      }
      
      // Append new content
      await fs.promises.appendFile(EXTENSIONS_CUSTOM_FILE, content);
      
      console.log(`Added DID configuration to ${EXTENSIONS_CUSTOM_FILE}`);
    } catch (error: any) {
      console.error('Error writing to extensions file:', error.message);
      throw new Error(`Failed to update Asterisk configuration: ${error.message}`);
    }
  }

  /**
   * Reload Asterisk dialplan
   */
  private async reloadAsteriskDialplan(): Promise<void> {
    try {
      // Try to reload via Asterisk CLI
      const { stdout, stderr } = await execAsync('asterisk -rx "dialplan reload"');
      
      if (stderr && !stderr.includes('Unable to connect')) {
        console.error('Asterisk reload stderr:', stderr);
      }
      
      console.log('Asterisk dialplan reloaded:', stdout.trim());
    } catch (error: any) {
      console.warn('Could not reload Asterisk dialplan:', error.message);
      console.warn('Note: Asterisk may not be installed or running on this system');
      // Don't throw error - allow operation to continue even if Asterisk is not available
    }
  }

  /**
   * Sanitize DID for use in Asterisk dialplan
   */
  private sanitizeDID(did: string): string {
    // Remove any non-numeric characters except + and _
    let sanitized = did.replace(/[^0-9+_X]/g, '');
    
    // If starts with +, replace with appropriate pattern
    if (sanitized.startsWith('+')) {
      sanitized = sanitized.substring(1); // Remove + prefix for Asterisk
    }
    
    return sanitized;
  }

  /**
   * Generate PJSIP endpoint configuration for IP-to-IP routing
   */
  async addPJSIPEndpoint(trunkName: string, allowedIPs: string[]): Promise<void> {
    const pjsipFile = path.join(ASTERISK_CONFIG_PATH, 'pjsip_custom.conf');
    
    let config = `\n; Auto-generated PJSIP endpoint: ${trunkName}\n`;
    config += `[${trunkName}](carrier-trunk-template)\n`;
    config += `; Inherits from template\n\n`;
    
    config += `[${trunkName}-aor](carrier-trunk-template-aor)\n`;
    config += `; AOR configuration\n\n`;
    
    config += `[${trunkName}-identify](carrier-trunk-template-identify)\n`;
    config += `endpoint=${trunkName}\n`;
    
    for (const ip of allowedIPs) {
      config += `match=${ip}\n`;
    }
    
    config += `\n`;
    
    try {
      await fs.promises.mkdir(path.dirname(pjsipFile), { recursive: true });
      await fs.promises.appendFile(pjsipFile, config);
      
      console.log(`Added PJSIP endpoint configuration for ${trunkName}`);
      
      // Reload PJSIP
      await execAsync('asterisk -rx "pjsip reload"');
    } catch (error: any) {
      console.warn('Could not update PJSIP configuration:', error.message);
    }
  }

  /**
   * Test if Asterisk is available
   */
  async testAsteriskConnection(): Promise<boolean> {
    try {
      await execAsync('asterisk -rx "core show version"');
      return true;
    } catch {
      return false;
    }
  }
}

export default new AsteriskConfigManager();
