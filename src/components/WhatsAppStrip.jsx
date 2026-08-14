/* Opens a chat with Jitesh, message already typed — the reader just hits send. */
const NUMBER = '919528865610';
const HELLO = 'नमस्ते जितेश! पहाड़ी बैठक की लिस्ट में मुझे जोड़ दीजिए 🙏';
const JOIN = `https://wa.me/${NUMBER}?text=${encodeURIComponent(HELLO)}`;

export default function WhatsAppStrip() {
  return (
    <a class="wa" href={JOIN} target="_blank" rel="noopener">
      <span class="wa__ico" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path fill="#0B120F" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.6-4.9c-.4-.7-.9-1.6-.9-2.5s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6a8.8 8.8 0 0 0 3.5 3c.3.2.5.1.6 0l.8-.9c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3z" />
        </svg>
      </span>
      <span class="wa__txt">
        <b>नया गाना आते ही पता चले</b>
        <i>Message Jitesh on WhatsApp — one message a week, nothing else</i>
      </span>
      <span class="wa__cta">Join free</span>
    </a>
  );
}
