
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  delay?: number
  hoverEffect?: boolean  // 是否启用 hover 缩放效果，默认关闭
}

export function AnimatedCard({ className, delay = 0, hoverEffect = false, children, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <Card
        className={cn(className)}
        hoverScale={hoverEffect}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  )
}
