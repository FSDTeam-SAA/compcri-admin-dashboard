"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { withBasePath } from "@/lib/paths";
import { UserRound, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
} from "@/lib/api";
import type { User } from "@/lib/types";
import {
  Avatar,
  PasswordInput,
  Field,
  Pending,
  ErrorState,
  DetailSkeleton,
} from "./shared";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function SettingsPage({ security = false }: { security?: boolean }) {
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const client = useQueryClient();
  return (
    <div className="settings-layout">
      <aside className="panel settings-sidebar">
        <h1>Settings</h1>
        <nav aria-label="Settings">
          <Link className={!security ? "active" : ""} href="/settings">
            <UserRound size={21} strokeWidth={1.5} />
            Profile
          </Link>
          <Link className={security ? "active" : ""} href="/settings/security">
            <Shield size={21} strokeWidth={1.5} />
            Change Password
          </Link>
          <button
            className="logout-link"
            onClick={async () => {
              client.clear();
              await signOut({ callbackUrl: withBasePath("/login") });
            }}
          >
            <LogOut size={20} strokeWidth={1.5} />
            Logout
          </button>
        </nav>
      </aside>
      <section
        className={`panel settings-panel ${security ? "security-panel" : ""}`}
      >
        <h2>Personal Information</h2>
        {security ? (
          <SecurityForm />
        ) : profile.isPending ? (
          <DetailSkeleton />
        ) : profile.isError ? (
          <ErrorState retry={() => profile.refetch()} />
        ) : (
          profile.data && (
            <ProfileForm
              key={
                profile.data._id +
                "-" +
                profile.data.displayName +
                "-" +
                profile.data.avatarMediaId?._id
              }
              user={profile.data}
            />
          )
        )}
      </section>
    </div>
  );
}
function ProfileForm({ user }: { user: User }) {
  const [firstName, setFirst] = useState(
    user.firstName || user.displayName?.split(" ")[0] || "",
  );
  const [lastName, setLast] = useState(
    user.lastName || user.displayName?.split(" ").slice(1).join(" ") || "",
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: async () => {
      const avatar = photo ? await uploadPhoto(photo) : undefined;
      return updateProfile({
        firstName,
        lastName,
        displayName: [firstName, lastName].filter(Boolean).join(" "),
        ...(avatar ? { avatarMediaId: avatar._id } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Profile updated");
      client.invalidateQueries({ queryKey: ["profile"] });
      setPhoto(null);
    },
  });
  function cancel() {
    setFirst(user.firstName || user.displayName?.split(" ")[0] || "");
    setLast(
      user.lastName || user.displayName?.split(" ").slice(1).join(" ") || "",
    );
    setPhoto(null);
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="profile-content">
        <div className="profile-summary">
          <Avatar user={user} size="large" />
          <div>
            <h3>{user.displayName || "Administrator"}</h3>
            <p>{user.email}</p>
            <label className="change-photo" htmlFor="profile-photo">
              {photo ? photo.name : "Change photo"}
            </label>
            <input
              className="sr-only"
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.error("Choose a photo smaller than 5 MB.");
                  return;
                }
                setPhoto(file || null);
              }}
            />
          </div>
        </div>
        <div className="profile-fields">
          <div className="profile-input">
            <label htmlFor="first-name">First Name</label>
            <Input
              id="first-name"
              required
              maxLength={60}
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>
          <div className="profile-input">
            <label htmlFor="last-name">Last Name</label>
            <Input
              id="last-name"
              required
              maxLength={60}
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
          <div className="profile-input">
            <label htmlFor="profile-email">Email</label>
            <Input
              id="profile-email"
              value={user.email}
              readOnly
              type="email"
            />
          </div>
        </div>
      </div>
      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          onClick={cancel}
          disabled={save.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          <Pending pending={save.isPending}>Save Changes</Pending>
        </Button>
      </div>
    </form>
  );
}
function SecurityForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const save = useMutation({
    mutationFn: () => changePassword(current, password),
    onSuccess: async () => {
      toast.success("Password changed. Please sign in again.");
      await signOut({ callbackUrl: withBasePath("/login") });
    },
  });
  return (
    <form
      className="security-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          toast.error("New passwords do not match.");
          return;
        }
        save.mutate();
      }}
    >
      <Field label="Current Password" id="current-password">
        <PasswordInput
          id="current-password"
          placeholder="********"
          autoComplete="current-password"
          value={current}
          required
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="New Password" id="new-password">
        <PasswordInput
          id="new-password"
          placeholder="********"
          autoComplete="new-password"
          value={password}
          minLength={10}
          maxLength={128}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm Password" id="confirm-password">
        <PasswordInput
          id="confirm-password"
          placeholder="********"
          autoComplete="new-password"
          value={confirm}
          minLength={10}
          maxLength={128}
          required
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={() => {
            setCurrent("");
            setPassword("");
            setConfirm("");
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          <Pending pending={save.isPending}>Save Changes</Pending>
        </Button>
      </div>
    </form>
  );
}
