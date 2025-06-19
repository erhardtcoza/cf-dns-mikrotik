import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function DNSDashboard() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(null);
  const [newIP, setNewIP] = useState("");

async function updateRecord(name) {
  const res = await fetch(`/admin/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ip: newIP })
  });
  if (res.ok) {
    setEditing(null);
    fetchRecords();
  } else {
    alert("Failed to update");
  }
}

  async function handleLogin() {
    const res = await fetch("/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setAuth(true);
      fetchRecords();
    } else {
      alert("Invalid password");
    }
  }

  async function fetchRecords() {
    const res = await fetch("/dns-dashboard");
    const data = await res.json();
    setRecords(data);
  }

  useEffect(() => {
    fetch("/admin/session").then(res => {
      if (res.ok) setAuth(true);
    });
  }, []);

  const filtered = records.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase())
  );

  async function deleteRecord(name) {
    if (!confirm(`Delete ${name}?`)) return;
    const res = await fetch(`/admin/delete?name=${encodeURIComponent(name)}`, {
      method: "POST"
    });
    if (res.ok) {
      fetchRecords();
    } else {
      alert("Failed to delete");
    }
  }

  if (!auth) {
    return (
      <div className="p-6 space-y-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <Input
          placeholder="Enter admin password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button onClick={handleLogin}>Login</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">DNS Records Dashboard (Admin)</h1>

      <Input 
        placeholder="Filter by name..." 
        value={filter} 
        onChange={e => setFilter(e.target.value)} 
        className="max-w-sm"
      />

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <Table>
            <TableHeader>
              <TableCell>
  {editing === record.name ? (
    <>
      <Input
        className="w-32 inline mr-2"
        value={newIP}
        onChange={e => setNewIP(e.target.value)}
        placeholder="New IP"
      />
      <Button size="sm" onClick={() => updateRecord(record.name)}>Save</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
    </>
  ) : (
    <>
      <Button size="sm" className="mr-2" onClick={() => {
        setEditing(record.name);
        setNewIP(record.content);
      }}>Edit</Button>
      <Button size="sm" variant="destructive" onClick={() => deleteRecord(record.name)}>
        Delete
      </Button>
    </>
  )}
</TableCell>

            </TableHeader>
            <TableBody>
              {filtered.map((record, idx) => {
                const updatedTime = new Date(record.updated);
                const uptime = Math.floor((Date.now() - updatedTime.getTime()) / 60000);
                const readable = uptime < 60 ? `${uptime} min` : `${(uptime / 60).toFixed(1)} hrs`;
                return (
                  <TableRow key={idx}>
                  <TableCell>
  {editing === record.name ? (
    <>
      <Input
        className="w-32 inline mr-2"
        value={newIP}
        onChange={e => setNewIP(e.target.value)}
        placeholder="New IP"
      />
      <Button size="sm" onClick={() => updateRecord(record.name)}>Save</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
    </>
  ) : (
    <>
      <Button size="sm" className="mr-2" onClick={() => {
        setEditing(record.name);
        setNewIP(record.content);
      }}>Edit</Button>
   async function updateRecord(name) {
  const res = await fetch(`/admin/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ip: newIP })
  });
  if (res.ok) {
    setEditing(null);
    fetchRecords();
  } else {
    alert("Failed to update");
  }
}

      <Button size="sm" variant="destructive" onClick={() => deleteRecord(record.name)}>Delete</Button>
    </>
  )}
</TableCell>
    <Button size="sm" variant="destructive" onClick={() => deleteRecord(record.name)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
