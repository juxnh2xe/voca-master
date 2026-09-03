import React, { useState } from 'react';
import { FolderTree, Plus, Folder, Edit2, Trash2, ChevronRight, BookOpen, Check } from 'lucide-react';
import { Folder as FolderType, Word } from '../../types/voca';

interface FolderManagerProps {
  folders: FolderType[];
  words: Word[];
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddFolder: (name: string, parentId: string | null, description?: string) => Promise<string>;
  onUpdateFolder: (id: string, name: string, parentId: string | null) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  words,
  currentFolderId,
  onSelectFolder,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);

  // 각 폴더에 소속된 단어 수 집계
  const wordCountByFolder = new Map<string, number>();
  words.forEach((w) => {
    if (w.folderId) {
      wordCountByFolder.set(w.folderId, (wordCountByFolder.get(w.folderId) || 0) + 1);
    }
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onAddFolder(newFolderName.trim(), newParentId, newDesc.trim() || undefined);
    setNewFolderName('');
    setNewDesc('');
    setIsCreating(false);
  };

  const startEdit = (f: FolderType) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditParentId(f.parentId);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    await onUpdateFolder(editingId, editName.trim(), editParentId);
    setEditingId(null);
  };

  // 재귀 렌더링 헬퍼
  const renderFolderNode = (parentId: string | null, depth: number = 0) => {
    const children = folders.filter((f) => f.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-4 sm:ml-6 pl-3 border-l-2 border-slate-200' : ''}`}>
        {children.map((folder) => {
          const isSelected = currentFolderId === folder.id;
          const wordCount = wordCountByFolder.get(folder.id) || 0;
          const isEditing = editingId === folder.id;

          return (
            <div key={folder.id} className="space-y-1.5">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex items-center gap-2 p-2 bg-indigo-50/80 rounded-xl border border-indigo-200">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                  <select
                    value={editParentId || ''}
                    onChange={(e) => setEditParentId(e.target.value || null)}
                    className="text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="">(최상위 루트)</option>
                    {folders
                      .filter((f) => f.id !== folder.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                  >
                    취소
                  </button>
                </form>
              ) : (
                <div
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-slate-800">
                        {folder.name}
                      </span>
                      {folder.description && (
                        <p className="text-[11px] text-slate-400 font-normal">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {wordCount}단어
                    </span>

                    <button
                      onClick={() => startEdit(folder)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"
                      title="폴더 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `'${folder.name}' 폴더를 삭제하시겠습니까? 소속 단어들은 상위 폴더로 안전하게 이동됩니다.`
                          )
                        ) {
                          onDeleteFolder(folder.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title="폴더 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 하위 자식 폴더 재귀 호출 */}
              {renderFolderNode(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-600" />
              단어장 폴더 관리
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              필요한 폴더를 만들고 단어장을 체계적으로 분류하세요.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>새 폴더 추가</span>
          </button>
        </div>

        {/* 새 폴더 생성 폼 */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">새 폴더 만들기</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                placeholder="폴더 이름 입력"
                className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
              />
              <select
                value={newParentId || ''}
                onChange={(e) => setNewParentId(e.target.value || null)}
                className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl"
              >
                <option value="">(최상위 폴더로 생성)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    상위: {f.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명/메모 (선택)"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                생성 완료
              </button>
            </div>
          </form>
        )}

        {/* 최상위 전체 단어장 노드 */}
        <div
          onClick={() => onSelectFolder(null)}
          className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
            currentFolderId === null
              ? 'bg-indigo-50/90 border-indigo-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              📚
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900">전체 단어장 (루트)</span>
              <p className="text-[11px] text-slate-400">모든 폴더의 단어를 한 번에 탐색</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            총 {words.length}단어
          </span>
        </div>

        {/* 계층형 폴더 트리 */}
        <div className="pt-2">
          {renderFolderNode(null, 0)}
        </div>
      </div>
    </div>
  );
};
