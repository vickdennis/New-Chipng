import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Layout, Link as LinkIcon, User, Settings, BarChart2, 
  Plus, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon,
  LogOut, ExternalLink, Copy, Check, Moon, Sun, Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { Profile, Link, THEMES, ThemeType, ButtonStyle } from '../types';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const SortableLinkItem = ({ link, onUpdate, onDelete }: { 
  link: Link; 
  onUpdate: (id: string, data: Partial<Link>) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4 group">
      <button {...attributes} {...listeners} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={link.title}
            onChange={(e) => onUpdate(link.id, { title: e.target.value })}
            className="flex-1 bg-transparent font-bold text-zinc-900 dark:text-white outline-none"
            placeholder="Link Title"
          />
          <button 
            onClick={() => onUpdate(link.id, { active: !link.active })}
            className={`transition-colors ${link.active ? 'text-lime-500' : 'text-zinc-400'}`}
          >
            {link.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <input 
          type="text" 
          value={link.url}
          onChange={(e) => onUpdate(link.id, { url: e.target.value })}
          className="w-full bg-transparent text-sm text-zinc-500 outline-none"
          placeholder="https://example.com"
        />
      </div>

      <button 
        onClick={() => onDelete(link.id)}
        className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics' | 'settings'>('links');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
      if (doc.exists()) setProfile(doc.data() as Profile);
    });

    const q = query(collection(db, 'links'), where('userId', '==', user.uid), orderBy('position', 'asc'));
    const unsubLinks = onSnapshot(q, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link)));
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubLinks();
    };
  }, [user]);

  const handleAddLink = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'links'), {
        userId: user.uid,
        title: 'New Link',
        url: '',
        active: true,
        position: links.length,
        clicks: 0
      });
      toast.success('Link added');
    } catch (error) {
      toast.error('Failed to add link');
    }
  };

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    try {
      await updateDoc(doc(db, 'links', id), data);
    } catch (error) {
      toast.error('Failed to update link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'links', id));
      toast.success('Link deleted');
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = links.findIndex(l => l.id === active.id);
      const newIndex = links.findIndex(l => l.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);
      
      setLinks(newLinks);

      const batch = writeBatch(db);
      newLinks.forEach((link, index) => {
        batch.update(doc(db, 'links', link.id), { position: index });
      });
      await batch.commit();
    }
  };

  const handleUpdateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await handleUpdateProfile({ photoURL: url });
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`chipng.com/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-lime-400 rounded-lg flex items-center justify-center">
            <LinkIcon className="text-zinc-950 w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tighter dark:text-white">Chip NG</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'links', icon: LinkIcon, label: 'Links' },
            { id: 'appearance', icon: Palette, label: 'Appearance' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white capitalize">{activeTab}</h1>
              <p className="text-zinc-500">Manage your profile and links</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-lime-500" /> : <Copy className="w-4 h-4" />}
                {profile?.username}
              </button>
              <a 
                href={`/${profile?.username}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </a>
            </div>
          </header>

          {activeTab === 'links' && (
            <div className="space-y-6">
              <button 
                onClick={handleAddLink}
                className="w-full py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20"
              >
                <Plus className="w-5 h-5" />
                Add New Link
              </button>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {links.map((link) => (
                      <SortableLinkItem 
                        key={link.id} 
                        link={link} 
                        onUpdate={handleUpdateLink}
                        onDelete={handleDeleteLink}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'appearance' && profile && (
            <div className="space-y-12">
              {/* Profile Section */}
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-8">
                <h2 className="text-xl font-bold dark:text-white">Profile</h2>
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-4 border-zinc-50 dark:border-zinc-950 shadow-xl">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <ImageIcon className="w-6 h-6" />
                      <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Display Name</label>
                      <input 
                        type="text" 
                        value={profile.displayName || ''}
                        onChange={(e) => handleUpdateProfile({ displayName: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Bio</label>
                      <textarea 
                        value={profile.bio || ''}
                        onChange={(e) => handleUpdateProfile({ bio: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white h-24 resize-none"
                        placeholder="Tell your story..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Themes Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Themes</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => (
                    <button
                      key={themeKey}
                      onClick={() => handleUpdateProfile({ theme: themeKey })}
                      className={`p-4 rounded-2xl border-2 transition-all text-center space-y-3 ${
                        profile.theme === themeKey 
                          ? 'border-lime-400 bg-lime-400/5' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-full aspect-square rounded-xl ${THEMES[themeKey].background} border border-zinc-200 dark:border-zinc-800`} />
                      <span className="text-sm font-bold dark:text-white capitalize">{themeKey}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Button Styles */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Button Style</h2>
                <div className="grid grid-cols-3 gap-4">
                  {(['rounded', 'pill', 'square'] as ButtonStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleUpdateProfile({ buttonStyle: style })}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        profile.buttonStyle === style 
                          ? 'border-lime-400 bg-lime-400/5' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-full h-10 bg-zinc-900 dark:bg-white ${
                        style === 'rounded' ? 'rounded-xl' : style === 'pill' ? 'rounded-full' : 'rounded-none'
                      }`} />
                      <span className="block mt-4 text-sm font-bold dark:text-white capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 text-sm font-medium">Total Profile Views</span>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white mt-2">
                    {profile?.totalClicks || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 text-sm font-medium">Total Link Clicks</span>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white mt-2">
                    {links.reduce((acc, l) => acc + (l.clicks || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold dark:text-white mb-6">Link Performance</h2>
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                      <div>
                        <div className="font-bold dark:text-white">{link.title}</div>
                        <div className="text-sm text-zinc-500 truncate max-w-[200px]">{link.url}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold dark:text-white">{link.clicks || 0}</div>
                        <div className="text-xs text-zinc-500">clicks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                    <div>
                      <div className="font-bold dark:text-white">Email</div>
                      <div className="text-sm text-zinc-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                    <div>
                      <div className="font-bold dark:text-white">Member Since</div>
                      <div className="text-sm text-zinc-500">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 space-y-6">
                <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                <p className="text-red-600/70 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
                  Delete Account
                </button>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
