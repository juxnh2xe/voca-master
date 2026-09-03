import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Folder } from '../types/voca';
import { saveFolderToCloud, deleteFolderFromCloud, saveWordToCloud } from '../services/supabase';

export interface FolderBreadcrumbItem {
  id: string | null;
  name: string;
}

export const useFolders = () => {
  const folders = useLiveQuery(() => db.folders.toArray(), []) || [];

  // 특정 폴더의 부모 경로(Breadcrumbs) 계산
  const getBreadcrumbs = (folderId: string | null): FolderBreadcrumbItem[] => {
    const trail: FolderBreadcrumbItem[] = [{ id: null, name: '홈 / 전체 단어장' }];
    if (!folderId) return trail;

    const pathMap = new Map<string, Folder>();
    folders.forEach((f) => pathMap.set(f.id, f));

    const path: FolderBreadcrumbItem[] = [];
    let currId: string | null = folderId;
    const visited = new Set<string>();

    while (currId && pathMap.has(currId) && !visited.has(currId)) {
      visited.add(currId);
      const folderItem: Folder | undefined = pathMap.get(currId);
      if (!folderItem) break;
      path.unshift({ id: folderItem.id, name: folderItem.name });
      currId = folderItem.parentId;
    }

    return [...trail, ...path];
  };

  // 폴더 트리 계층 구조 생성 (드롭다운이나 탐색기용)
  const getFolderTreeOptions = (
    excludeId?: string
  ): Array<{ id: string; name: string; depth: number }> => {
    const result: Array<{ id: string; name: string; depth: number }> = [];

    const build = (parentId: string | null, depth: number) => {
      const children = folders.filter(
        (f) => f.parentId === parentId && f.id !== excludeId
      );
      for (const child of children) {
        result.push({
          id: child.id,
          name: `${'— '.repeat(depth)}${child.name}`,
          depth,
        });
        build(child.id, depth + 1);
      }
    };

    build(null, 0);
    return result;
  };

  const addFolder = async (name: string, parentId: string | null = null, description?: string) => {
    const newFolder: Folder = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      parentId,
      description,
      createdAt: new Date().toISOString(),
    };
    await db.folders.add(newFolder);
    saveFolderToCloud(newFolder);
    return newFolder.id;
  };

  const updateFolder = async (id: string, name: string, parentId: string | null) => {
    await db.folders.update(id, { name: name.trim(), parentId });
    const updated = await db.folders.get(id);
    if (updated) saveFolderToCloud(updated);
  };

  const deleteFolder = async (id: string) => {
    // 삭제할 폴더 안의 단어들을 상위 폴더(혹은 루트)로 이동
    const targetFolder = folders.find((f) => f.id === id);
    const parentId = targetFolder?.parentId || null;

    const affectedWords = await db.words.where('folderId').equals(id).toArray();
    for (const w of affectedWords) {
      await db.words.update(w.id, { folderId: parentId });
      const updatedW = await db.words.get(w.id);
      if (updatedW) saveWordToCloud(updatedW);
    }

    // 하위 폴더들도 상위 폴더로 이동
    const childFolders = folders.filter((f) => f.parentId === id);
    for (const c of childFolders) {
      await db.folders.update(c.id, { parentId });
      const updatedF = await db.folders.get(c.id);
      if (updatedF) saveFolderToCloud(updatedF);
    }

    await db.folders.delete(id);
    deleteFolderFromCloud(id);
  };

  return {
    folders,
    getBreadcrumbs,
    getFolderTreeOptions,
    addFolder,
    updateFolder,
    deleteFolder,
  };
};
