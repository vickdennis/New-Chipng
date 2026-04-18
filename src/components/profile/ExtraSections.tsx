import React from 'react';
import { motion } from 'motion/react';
import { User, THEMES } from '../../types';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface ExtraSectionsProps {
  profile: User;
}

export const ExtraSections: React.FC<ExtraSectionsProps> = ({ profile }) => {
  const btnShape = profile.buttonStyle === 'pill' ? 'rounded-full' : profile.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none';

  return (
    <div className="w-full mt-12 space-y-12">
      {/* Google Maps (Business Plan) */}
      {profile.location?.lat && profile.location?.lng && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`w-full p-6 bg-black/30 backdrop-blur-2xl border border-white/10 ${btnShape} overflow-hidden shadow-2xl`}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-lime-400 text-black flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-black text-xl text-white tracking-tight italic">Find Us</h3>
          </div>
          
          <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 border border-white/5 shadow-inner">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${profile.location.lat},${profile.location.lng}`}
              allowFullScreen
              loading="lazy"
            />
          </div>
          
          {profile.location.address && (
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
              <MapPin className="w-5 h-5 text-white/40 mt-0.5" />
              <p className="text-white/80 text-sm leading-relaxed">{profile.location.address}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Appointments Section */}
      {profile.appointmentsEnabled && profile.appointments && profile.appointments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full space-y-6"
        >
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-black text-2xl text-white tracking-tight italic">Book Session</h3>
          </div>

          <div className="grid gap-4">
            {profile.appointments.map((apt, idx) => (
              <motion.a
                key={idx}
                href={apt.contactLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                className={`p-5 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 ${btnShape} transition-all group flex items-center justify-between shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <Clock className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg group-hover:text-emerald-300 transition-colors">{apt.title}</h4>
                    <p className="text-sm text-white/50">
                      {format(new Date(apt.dateTime), 'PPP p')}
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </motion.a>
            ))}
          </div>

          <div className="flex justify-center pt-2">
             <button className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
               Powered by Chip NG
             </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
