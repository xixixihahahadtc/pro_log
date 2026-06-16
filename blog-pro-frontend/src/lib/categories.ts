/** 将树形分类展平为选项数组 */
export interface CategoryOption {
  label: string;
  value: string;
}

export function flattenCategories(
  nodes: { id: number; name: string; children?: any[] }[]
): CategoryOption[] {
  const result: CategoryOption[] = [];
  function walk(list: any[]) {
    for (const node of list) {
      result.push({ label: node.name, value: String(node.id) });
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}
