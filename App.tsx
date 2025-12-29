
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { GameProvider } from './GameContext';
import Layout from './components/Layout';
import Auth from './views/Auth';
import Overview from './views/Overview';
import Buildings from './views/Buildings';
import Shipyard from './views/Shipyard';
import Galaxy from './