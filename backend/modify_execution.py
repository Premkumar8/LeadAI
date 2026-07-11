import sys

file_path = r'd:\LeadAI SaaS\frontend\src\app\execution\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject state
state_code = '''  const [activeTab, setActiveTab] = useState<"Contacted" | "Not Contacted">("Not Contacted");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkIndex, setBulkIndex] = useState(0);'''

content = content.replace(
'''  const [activeTab, setActiveTab] = useState<"Contacted" | "Not Contacted">("Not Contacted");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;''', state_code)

# 2. Inject toggle methods right after `const paginatedContacts = activeContacts.slice...`
toggle_methods = '''
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const toggleSelectAll = () => {
    if (paginatedContacts.length > 0 && selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      const newSet = new Set(selectedContacts);
      paginatedContacts.forEach(c => newSet.add(c.id));
      setSelectedContacts(newSet);
    }
  };
'''

# Find paginatedContacts
target_paginated = '  const paginatedContacts = activeContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);'
content = content.replace(target_paginated, target_paginated + toggle_methods)

# 3. Add Bulk WhatsApp button in the search header
header_old = '''                {/* Search */}
                <div className="relative w-full md:w-96">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />'''

header_new = '''                {/* Search & Bulk Action */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  {selectedContacts.size > 0 && (
                    <button 
                      onClick={() => { setShowBulkModal(true); setBulkIndex(0); setBulkMessage(""); }}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all animate-fade-in"
                    >
                      <MessageCircle size={18} />
                      Bulk WhatsApp ({selectedContacts.size})
                    </button>
                  )}
                  <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />'''

content = content.replace(header_old, header_new)
content = content.replace('                  />\n                </div>\n                <div className="text-sm', '                  />\n                  </div>\n                </div>\n                <div className="text-sm')

# 4. Add Checkbox to table header
th_old = '<th className="px-6 py-5 font-bold w-16 text-center">#</th>'
th_new = '''<th className="px-6 py-5 font-bold w-16 text-center">
  <input 
    type="checkbox" 
    checked={paginatedContacts.length > 0 && selectedContacts.size === paginatedContacts.length}
    onChange={toggleSelectAll}
    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"
  />
</th>'''
content = content.replace(th_old, th_new)

# 5. Add Checkbox to table row
td_old = '''<td className="px-6 py-4 text-center font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                {index + 1}
                              </td>'''
td_new = '''<td className="px-6 py-4 text-center font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={selectedContacts.has(contact.id)}
                                  onChange={() => toggleSelection(contact.id)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"
                                />
                              </td>'''
content = content.replace(td_old, td_new)

# 6. Append Modal at the very end
modal_code = '''
      {/* Bulk WhatsApp Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <MessageCircle className="text-green-500" />
                Bulk WhatsApp ({selectedContacts.size} contacts)
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">Message Template</label>
              <textarea 
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Hi {name}, this is from Swamy Jewellery..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-green-500 rounded-xl p-3 text-sm text-slate-200 outline-none h-32 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">Use {'{name}'} to insert the customer's name.</p>
              
              {bulkIndex < selectedContacts.size ? (
                <div className="mt-6 flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="text-sm text-slate-300">
                    Sending to contact <span className="font-bold text-white">{bulkIndex + 1}</span> of {selectedContacts.size}
                  </div>
                  <button
                    onClick={() => {
                      const contactId = Array.from(selectedContacts)[bulkIndex];
                      const contact = contacts.find(c => c.id === contactId);
                      if (contact && contact.phone) {
                        const msg = bulkMessage.replace('{name}', contact.full_name || "");
                        window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }
                      setBulkIndex(prev => prev + 1);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-green-500/20 transition-colors"
                  >
                    Send Next
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                  <p className="text-green-400 font-bold mb-2">All messages processed!</p>
                  <button
                    onClick={() => { setShowBulkModal(false); setSelectedContacts(new Set()); }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Close & Clear Selection
                  </button>
                </div>
              )}
            </div>
            {bulkIndex < selectedContacts.size && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
'''
content = content.replace('    </div>\n  );\n}\n', modal_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated execution page successfully')
