
## Client-Side UI Pattern (Hide/Show/Disable based on permissions)

```js
// components/project-actions.tsx
'use client'

import { useSession } from "@/lib/auth/client";
import { authClient } from "@/lib/auth/client";

export function ProjectActions({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const activeMember = session?.activeMember;

  // Check permissions client-side for UI
  const canUpdate = activeMember && authClient.organization.checkRolePermission({
    role: activeMember.role,
    permissions: { project: ["update"] },
  });

  const canDelete = activeMember && authClient.organization.checkRolePermission({
    role: activeMember.role,
    permissions: { project: ["delete"] },
  });

  return (
    <div>
      {canUpdate && <button onClick={handleUpdate}>Edit</button>}
      {canDelete && <button onClick={handleDelete}>Delete</button>}
    </div>
  );
}
```