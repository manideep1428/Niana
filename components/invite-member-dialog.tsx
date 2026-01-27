"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface InviteMemberDialogProps {
    projectId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function InviteMemberDialog({ projectId, trigger, open, onOpenChange }: InviteMemberDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : internalOpen;
    const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen;

    const [email, setEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    const performInvite = useMutation(api.mutations.inviteTeamMember);
    const removeMember = useMutation(api.mutations.removeTeamMember);
    const members = useQuery(api.quires.getProjectMembers, { project_id: projectId });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsInviting(true);
        try {
            const result = await performInvite({
                project_id: projectId,
                email: email.trim(),
                role: "member",
            });

            if (result.success) {
                toast.success(result.message);
                setEmail("");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to invite member");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (userId: string) => {
        // confirm dialog?
        try {
            const result = await removeMember({
                project_id: projectId,
                user_id: userId,
            });

            if (result.success) {
                toast.success("Member removed");
            }
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    return (
        <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Share
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <form onSubmit={handleInvite} className="flex gap-2">
                        <Input
                            placeholder="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" disabled={isInviting}>
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
                        </Button>
                    </form>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
                        {!members ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center">No members yet</p>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.userInfo?.profile_picture_url || ""} />
                                                <AvatarFallback>
                                                    {member.userInfo?.first_name?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {member.userInfo?.first_name || "Unknown"} {member.userInfo?.last_name || ""}
                                                    {member.role === "owner" && (
                                                        <span className="ml-2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">Owner</span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{member.userInfo?.email}</span>
                                            </div>
                                        </div>
                                        {member.role !== "owner" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemove(member.user_id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
