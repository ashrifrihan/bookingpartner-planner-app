const fs = require('fs');
const execSync = require('child_process').execSync;
const files = execSync('git grep -ilE "✓|✕|❌|✅|🚀|💡"').toString().trim().split('\n');

function replaceIcons(content, file) {
  let modified = content;
  
  let importsNeeded = new Set();
  
  if (modified.includes('💡')) {
    modified = modified.replace(/'💡'/g, "<IdeaIcon size={14} />");
    importsNeeded.add('IdeaIcon');
  }
  
  if (modified.includes('✕')) {
    modified = modified.replace(/'✕ Cancel'/g, "<><CloseIcon size={12} style={{marginRight: 4, display: 'inline-block'}}/> Cancel</>");
    modified = modified.replace(/>✕</g, "><CloseIcon size={14} /><");
    importsNeeded.add('CloseIcon');
  }
  
  if (modified.includes('✓')) {
    modified = modified.replace(/'✓ Yesterday completed cleanly\. Roadmap on track\.'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Yesterday completed cleanly. Roadmap on track.</>");
    modified = modified.replace(/'✓ Copied'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Copied</>");
    modified = modified.replace(/'✓ Completed'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Completed</>");
    modified = modified.replace(/'✓ Mark Done & Close'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Mark Done & Close</>");
    modified = modified.replace(/'✓ Saved'/g, "<><CheckIcon size={12} style={{marginRight: 4, display: 'inline-block'}}/> Saved</>");
    modified = modified.replace(/'✓ Copied for Slack'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Copied for Slack</>");
    modified = modified.replace(/'✓ Copied to Clipboard'/g, "<><CheckIcon size={14} style={{marginRight: 4, display: 'inline-block'}}/> Copied to Clipboard</>");
    modified = modified.replace(/'✓'/g, "<CheckIcon size={14} />");
    modified = modified.replace(/>✓ (.*?)<\//g, "><CheckIcon size={12} style={{marginRight: 4, display: 'inline-block'}}/> $1</");
    modified = modified.replace(/>✓</g, "><CheckIcon size={14} /><");
    importsNeeded.add('CheckIcon');
  }

  if (importsNeeded.size > 0 && !file.includes('lib/visuals.tsx')) {
    const importStr = Array.from(importsNeeded).join(', ');
    if (modified.includes('@/lib/visuals')) {
      const regex = /import \{(.*?)\} from '@\/lib\/visuals';/;
      modified = modified.replace(regex, (match, p1) => {
        const existing = p1.split(',').map(s => s.trim());
        importsNeeded.forEach(i => {
          if (!existing.includes(i)) existing.push(i);
        });
        return `import { ${existing.join(', ')} } from '@/lib/visuals';`;
      });
    } else {
      const lines = modified.split('\n');
      const lastImport = lines.findLastIndex(l => l.startsWith('import '));
      if (lastImport !== -1) {
        lines.splice(lastImport + 1, 0, `import { ${importStr} } from '@/lib/visuals';`);
        modified = lines.join('\n');
      } else {
        lines.unshift(`import { ${importStr} } from '@/lib/visuals';`);
        modified = lines.join('\n');
      }
    }
  }

  return modified;
}

files.forEach(file => {
  if (!file) return;
  const content = fs.readFileSync(file, 'utf8');
  const newContent = replaceIcons(content, file);
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
});
