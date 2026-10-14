import type { AppState } from './client-state';

export const sameState = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

/** Rebase only local changes over a fresh server snapshot; untouched remote items survive. */
export function mergeWorkspace(base: AppState, local: AppState, remote: AppState): AppState {
  const result:AppState={...remote};
  for(const key of ['progress','bookmarks'] as const){
    const before=base[key] as Record<string,unknown>;
    const after=local[key] as Record<string,unknown>;
    const merged:Record<string,unknown>={...remote[key]};
    for(const id of new Set([...Object.keys(before),...Object.keys(after)])){
      if(sameState(before[id],after[id]))continue;
      if(after[id]===undefined)delete merged[id];else merged[id]=after[id];
    }
    Object.assign(result,{[key]:merged});
  }
  const favoriteSet=new Set(remote.favorites);
  for(const id of base.favorites)if(!local.favorites.includes(id))favoriteSet.delete(id);
  for(const id of local.favorites)if(!base.favorites.includes(id))favoriteSet.add(id);
  result.favorites=[...favoriteSet];
  for(const key of ['registry','videos','reviews','questions','reports'] as const){
    const before=new Map(base[key].map(value=>[value.id,value]));
    const after=new Map(local[key].map(value=>[value.id,value]));
    const merged=new Map(remote[key].map(value=>[value.id,value]));
    for(const id of new Set([...before.keys(),...after.keys()])){
      if(sameState(before.get(id),after.get(id)))continue;
      const value=after.get(id);if(value===undefined)merged.delete(id);else merged.set(id,value);
    }
    Object.assign(result,{[key]:[...merged.values()]});
  }
  return result;
}
export function cacheStorageKey(accountKey: string): string {
  if(!/^[a-f0-9]{32}$/.test(accountKey))throw new Error('Invalid account cache namespace');
  return `lesson-library-v2:${accountKey}`;
}
