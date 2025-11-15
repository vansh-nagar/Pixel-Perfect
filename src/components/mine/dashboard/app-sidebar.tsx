import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  return (
    <Sidebar className=" mt-18 ml-4">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Patterns (Background)
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Tiles
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Noise / Grain
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Checkerboard
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Diagonal Stripes
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Organic Waves
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Shaders
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Vertex Shaders
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Fragment Shaders
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Noise / FBM Shader
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Post-processing
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            SVG Line Animations
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Animated Stroke
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Dashed Motion
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Parallax Lines
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Wave / Ribbon SVG
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            UI Patterns & Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Top Navbars
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Sidebars & Drawers
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Footers
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Feature Sections
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Integrations
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Gradients
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Linear
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Radial
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Conic / Angular
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Multicolor Blends
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Noise + Gradient Mix
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Animations (GSAP)
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Basic Motion
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              ScrollTrigger
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Stagger & Timelines
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Morph / SVG
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Physics-based
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Grids & Borders
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              CSS Grid Patterns
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Masonry Layouts
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Dotted / Dashed Borders
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Fancy Corners & Outlines
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className=" text-md text-accent-foreground">
            Three.js 3D
          </SidebarGroupLabel>
          <SidebarGroupContent className=" mt-1">
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Basic Scene
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Lighting & Materials
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Mesh Examples
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              GLTF Loader
            </SidebarMenuButton>
            <SidebarMenuButton className=" py-0 hover:border-l-4 transition-all duration-100 hover:bg-background text-sm text-muted-foreground h-7">
              Controls & Camera
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
    </Sidebar>
  );
};
