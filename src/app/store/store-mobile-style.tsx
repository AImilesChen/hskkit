export default function StoreMobileStyle(){
  return <style>{`@media (max-width: 700px) { body:has(main[data-store-route]) .feedback-trigger { position: static; margin: 12px 20px calc(20px + env(safe-area-inset-bottom)); } }`}</style>;
}
