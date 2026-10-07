using Banter.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Banter.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Server> Servers { get; set; }
        public DbSet<ServerMember> ServerMembers { get; set; }
        public DbSet<ServerBan> ServerBans { get; set; }
        public DbSet<Invite> Invites { get; set; }
        public DbSet<Channel> Channels { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageEditHistory> MessageEditHistories { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<PrivateMessage> PrivateMessages { get; set; }
        public DbSet<FriendGroup> FriendGroups { get; set; }
        public DbSet<GroupMessage> GroupMessages { get; set; }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<NullableUtcDateTimeConverter>();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Server>()
                .HasOne(s => s.Owner)
                .WithMany()
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ServerMember>(entity =>
            {
                entity.HasOne(sm => sm.Server)
                    .WithMany(s => s.ServerMembers)
                    .HasForeignKey(sm => sm.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sm => sm.User)
                    .WithMany(u => u.ServerMembers)
                    .HasForeignKey(sm => sm.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(sm => new { sm.ServerId, sm.UserId }).IsUnique();
            });

            modelBuilder.Entity<ServerBan>(entity =>
            {
                entity.HasOne(sb => sb.Server)
                    .WithMany(s => s.Bans)
                    .HasForeignKey(sb => sb.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sb => sb.BannedUser)
                    .WithMany()
                    .HasForeignKey(sb => sb.BannedUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sb => sb.BanningUser)
                    .WithMany()
                    .HasForeignKey(sb => sb.BanningUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(sb => new { sb.ServerId, sb.BannedUserId }).IsUnique();
            });

            modelBuilder.Entity<Invite>(entity =>
            {
                entity.HasOne(i => i.Server)
                    .WithMany(s => s.Invites)
                    .HasForeignKey(i => i.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(i => i.Inviter)
                    .WithMany()
                    .HasForeignKey(i => i.InviterId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(i => i.Code).IsUnique();
            });

            modelBuilder.Entity<Channel>()
                .HasOne(c => c.Server)
                .WithMany(s => s.Channels)
                .HasForeignKey(c => c.ServerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Channel>()
                .Property(c => c.ChannelType)
                .HasConversion<string>();

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasOne(m => m.Channel)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ChannelId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.User)
                    .WithMany(u => u.Messages)
                    .HasForeignKey(m => m.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(m => new { m.ChannelId, m.CreatedAt });
            });

            modelBuilder.Entity<MessageEditHistory>()
                .HasOne(h => h.Message)
                .WithMany(m => m.EditHistory)
                .HasForeignKey(h => h.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasOne(a => a.Message)
                    .WithMany(m => m.Attachments)
                    .HasForeignKey(a => a.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(a => a.Type).HasConversion<string>();
            });

            modelBuilder.Entity<Reaction>(entity =>
            {
                entity.HasOne(r => r.Message)
                    .WithMany(m => m.Reactions)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(r => new { r.MessageId, r.UserId, r.ReactionType }).IsUnique();
            });

            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.HasOne(f => f.Sender)
                    .WithMany(u => u.SentFriendRequests)
                    .HasForeignKey(f => f.SenderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(f => f.Receiver)
                    .WithMany(u => u.ReceivedFriendRequests)
                    .HasForeignKey(f => f.ReceiverId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(f => f.Status).HasConversion<string>();
            });

            modelBuilder.Entity<PrivateMessage>(entity =>
            {
                entity.HasOne(pm => pm.Sender)
                    .WithMany()
                    .HasForeignKey(pm => pm.SenderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pm => pm.Receiver)
                    .WithMany()
                    .HasForeignKey(pm => pm.ReceiverId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(pm => new { pm.SenderId, pm.ReceiverId, pm.SentAt });
            });

            modelBuilder.Entity<FriendGroup>(entity =>
            {
                entity.HasOne(fg => fg.Creator)
                    .WithMany()
                    .HasForeignKey(fg => fg.CreatorId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(fg => fg.Members)
                    .WithMany(u => u.FriendGroups)
                    .UsingEntity("FriendGroupMembers");
            });

            modelBuilder.Entity<GroupMessage>(entity =>
            {
                entity.HasOne(gm => gm.Group)
                    .WithMany(g => g.Messages)
                    .HasForeignKey(gm => gm.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(gm => gm.Sender)
                    .WithMany()
                    .HasForeignKey(gm => gm.SenderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(gm => gm.ReadBy)
                    .WithMany()
                    .UsingEntity("GroupMessageReadBy");

                entity.HasIndex(gm => new { gm.GroupId, gm.SentAt });
            });
        }
    }
}
