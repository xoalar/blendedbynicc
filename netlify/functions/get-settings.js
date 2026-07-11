const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DEFAULT_HOURS = [
  {day:'Monday',   open:'9:30 AM', close:'5:30 PM', closed:false},
  {day:'Tuesday',  open:'9:30 AM', close:'5:30 PM', closed:false},
  {day:'Wednesday',open:'9:30 AM', close:'5:30 PM', closed:false},
  {day:'Thursday', open:'9:30 AM', close:'5:30 PM', closed:false},
  {day:'Friday',   open:'9:00 AM', close:'9:00 PM', closed:false},
  {day:'Saturday', open:'9:00 AM', close:'4:00 PM', closed:false},
  {day:'Sunday',   open:'9:30 AM', close:'2:30 PM', closed:false},
];
const MON_THU  = ['9:30 AM','10:30 AM','11:30 AM','12:30 PM','1:30 PM','2:30 PM','3:30 PM','4:30 PM','5:30 PM'];
const FRIDAY   = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'];
const SATURDAY = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];
const SUNDAY   = ['9:30 AM','10:30 AM','11:30 AM','12:30 PM','1:30 PM','2:30 PM'];
const DEFAULT_PER_DAY = {0:MON_THU,1:MON_THU,2:MON_THU,3:MON_THU,4:FRIDAY,5:SATURDAY,6:SUNDAY};

exports.handler = async () => {
  try {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const [bookingsRes, settingsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/bookings?select=date_key,slot`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, { headers }),
    ]);
    const rows     = await bookingsRes.json();
    const settings = await settingsRes.json();

    // Build bookedSlots
    const bookedSlots = {};
    if (Array.isArray(rows)) {
      rows.forEach(row => {
        if (!bookedSlots[row.date_key]) bookedSlots[row.date_key] = [];
        if (!bookedSlots[row.date_key].includes(row.slot)) bookedSlots[row.date_key].push(row.slot);
      });
    }

    // Parse settings
    const settingsMap = {};
    if (Array.isArray(settings)) {
      settings.forEach(s => { try { settingsMap[s.key] = JSON.parse(s.value); } catch(e) {} });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopHours:    settingsMap.shopHours    || DEFAULT_HOURS,
        perDaySlots:  settingsMap.perDaySlots  || DEFAULT_PER_DAY,
        perDateSlots: settingsMap.perDateSlots || {},
        bookedSlots,
        blockedDates: settingsMap.blockedDates || [],
      }),
    };
  } catch(err) {
    console.error('get-settings error:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopHours:    DEFAULT_HOURS,
        perDaySlots:  DEFAULT_PER_DAY,
        perDateSlots: {},
        bookedSlots:  {},
        blockedDates: [],
      }),
    };
  }
};
