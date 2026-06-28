import { VideoHTMLAttributes } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

type Props = VideoHTMLAttributes<HTMLVideoElement> & {
  captionSrc?: string;
  captionLang?: string;
};

export const CaptionedVideo = ({
  captionSrc,
  captionLang = "en",
  children,
  ...rest
}: Props) => {
  const { preferences } = useAccessibility();
  return (
    <video {...rest}>
      {children}
      {captionSrc && (
        <track
          kind="captions"
          src={captionSrc}
          srcLang={captionLang}
          label={captionLang.toUpperCase()}
          default={preferences.auditoryImpaired}
        />
      )}
    </video>
  );
};
